-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Users (mirrors auth.users, holds game-specific profile data)
-- ─────────────────────────────────────────────────────────────
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  display_name text not null,
  discriminator integer not null,
  avatar      text,               -- sprite_ref pointing to a word_bank entry or sprite path
  created_at  timestamptz default now() not null
);

-- Discriminator counter: globally incrementing per display_name
create table public.discriminator_counters (
  display_name_lower text primary key,
  next_value         integer not null default 1
);

-- Function: atomically assign next discriminator for a given display_name
create or replace function public.next_discriminator(p_display_name text)
returns integer language plpgsql security definer as $$
declare
  v_lower text := lower(p_display_name);
  v_val   integer;
begin
  insert into public.discriminator_counters(display_name_lower, next_value)
    values (v_lower, 2)
    on conflict (display_name_lower)
    do update set next_value = discriminator_counters.next_value + 1
    returning next_value - 1 into v_val;
  if v_val is null then
    select next_value - 1 into v_val from public.discriminator_counters
      where display_name_lower = v_lower;
  end if;
  return v_val;
end;
$$;

-- Auto-create public.users row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_display_name text;
  v_disc         integer;
begin
  v_display_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );
  v_disc := public.next_discriminator(v_display_name);
  insert into public.users(id, email, display_name, discriminator, avatar)
    values (
      new.id,
      new.email,
      v_display_name,
      v_disc,
      new.raw_user_meta_data->>'avatar'
    );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stats (1-to-1 with users)
create table public.stats (
  user_id          uuid primary key references public.users(id) on delete cascade,
  games_played     integer not null default 0,
  games_won        integer not null default 0,
  terms_guessed    integer not null default 0,
  favorite_category text
);

create or replace function public.handle_new_user_stats()
returns trigger language plpgsql security definer as $$
begin
  insert into public.stats(user_id) values (new.id);
  return new;
end;
$$;

create trigger on_user_created_stats
  after insert on public.users
  for each row execute function public.handle_new_user_stats();

-- ─────────────────────────────────────────────────────────────
-- Adjectives (for auto-generated display names)
-- ─────────────────────────────────────────────────────────────
create table public.adjectives (
  id   serial primary key,
  word text not null unique
);

-- ─────────────────────────────────────────────────────────────
-- Word bank
-- ─────────────────────────────────────────────────────────────
create table public.word_bank (
  id         serial primary key,
  term       text not null,
  category   text not null,
  sprite_ref text,               -- relative path or URL to sprite asset
  is_active  boolean not null default true,
  unique(term, category)
);

create index word_bank_category_idx on public.word_bank(category) where is_active = true;

-- ─────────────────────────────────────────────────────────────
-- Lobbies
-- ─────────────────────────────────────────────────────────────
create table public.lobbies (
  id                              uuid primary key default gen_random_uuid(),
  code                            text not null unique,
  host_user_id                    uuid not null references public.users(id),
  visibility                      text not null default 'public' check (visibility in ('public','private')),
  status                          text not null default 'waiting' check (status in ('waiting','playing','finished')),
  mode                            text not null check (mode in ('teams','solo','classroom_streamer')),
  rules                           jsonb not null,
  classroom_clue_giver_player_id  uuid,
  created_at                      timestamptz default now() not null
);

create index lobbies_code_idx on public.lobbies(code);
create index lobbies_status_idx on public.lobbies(status) where status = 'waiting';

-- Generate a unique 5-character alphanumeric lobby code
create or replace function public.generate_lobby_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text;
begin
  loop
    code := '';
    for i in 1..5 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.lobbies where lobbies.code = code);
  end loop;
  return code;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Lobby teams
-- ─────────────────────────────────────────────────────────────
create table public.lobby_teams (
  id                          uuid primary key default gen_random_uuid(),
  lobby_id                    uuid not null references public.lobbies(id) on delete cascade,
  name                        text not null,
  score                       integer not null default 0,
  clue_master_rotation_index  integer not null default 0,
  turn_order                  integer not null
);

create index lobby_teams_lobby_idx on public.lobby_teams(lobby_id);

-- ─────────────────────────────────────────────────────────────
-- Lobby players
-- ─────────────────────────────────────────────────────────────
create table public.lobby_players (
  id                 uuid primary key default gen_random_uuid(),
  lobby_id           uuid not null references public.lobbies(id) on delete cascade,
  team_id            uuid references public.lobby_teams(id) on delete set null,
  user_id            uuid references public.users(id) on delete set null,
  guest_name         text,
  connection_status  text not null default 'connected' check (connection_status in ('connected','disconnected')),
  join_order         integer not null default 0,
  score              integer not null default 0,  -- used in solo mode
  constraint player_has_identity check (user_id is not null or guest_name is not null)
);

create index lobby_players_lobby_idx on public.lobby_players(lobby_id);
create index lobby_players_user_idx  on public.lobby_players(user_id) where user_id is not null;

-- ─────────────────────────────────────────────────────────────
-- Game state (one row per lobby, mutated in place)
-- ─────────────────────────────────────────────────────────────
create table public.game_state (
  lobby_id                uuid primary key references public.lobbies(id) on delete cascade,
  current_round           integer not null default 1,
  current_turn_player_id  uuid references public.lobby_players(id) on delete set null,
  current_team_id         uuid references public.lobby_teams(id) on delete set null,
  current_term            jsonb,
  slot_grid               jsonb not null default '[]'::jsonb,
  used_words_this_turn    text[] not null default '{}',
  used_term_ids           integer[] not null default '{}',
  phase                   text not null default 'waiting'
                            check (phase in ('waiting','turn_start','clueing','turn_end','round_end','game_over')),
  updated_at              timestamptz default now() not null
);

-- ─────────────────────────────────────────────────────────────
-- Chat messages (clues, guesses, system events)
-- ─────────────────────────────────────────────────────────────
create table public.chat_messages (
  id                 uuid primary key default gen_random_uuid(),
  lobby_id           uuid not null references public.lobbies(id) on delete cascade,
  sender_player_id   uuid references public.lobby_players(id) on delete set null,
  content            text not null,
  kind               text not null check (kind in ('clue','guess','system')),
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz default now() not null
);

create index chat_messages_lobby_idx on public.chat_messages(lobby_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- Guess log (enforces one-guess-per-clue server-side)
-- ─────────────────────────────────────────────────────────────
create table public.guess_log (
  id                uuid primary key default gen_random_uuid(),
  lobby_id          uuid not null references public.lobbies(id) on delete cascade,
  clue_message_id   uuid not null references public.chat_messages(id) on delete cascade,
  player_id         uuid not null references public.lobby_players(id) on delete cascade,
  term              text not null,
  correct           boolean not null,
  created_at        timestamptz default now() not null,
  unique(clue_message_id, player_id)  -- one guess per player per clue
);

create index guess_log_lobby_idx on public.guess_log(lobby_id);
