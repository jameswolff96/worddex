-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────

alter table public.users           enable row level security;
alter table public.stats           enable row level security;
alter table public.word_bank       enable row level security;
alter table public.adjectives      enable row level security;
alter table public.lobbies         enable row level security;
alter table public.lobby_teams     enable row level security;
alter table public.lobby_players   enable row level security;
alter table public.game_state      enable row level security;
alter table public.chat_messages   enable row level security;
alter table public.guess_log       enable row level security;

-- users: readable by all authenticated; writable by owner
create policy "users_select_all" on public.users for select using (true);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- stats: readable by all; only system (service role) updates
create policy "stats_select_all" on public.stats for select using (true);
create policy "stats_update_own" on public.stats for update using (auth.uid() = user_id);

-- word_bank: public read
create policy "word_bank_select" on public.word_bank for select using (is_active = true);

-- adjectives: public read
create policy "adjectives_select" on public.adjectives for select using (true);

-- lobbies: public lobbies visible to all; private only to participants
create policy "lobbies_select_public" on public.lobbies
  for select using (
    visibility = 'public'
    or host_user_id = auth.uid()
    or exists (
      select 1 from public.lobby_players lp
      where lp.lobby_id = lobbies.id and lp.user_id = auth.uid()
    )
  );

create policy "lobbies_insert_auth" on public.lobbies
  for insert with check (auth.uid() is not null and host_user_id = auth.uid());

create policy "lobbies_update_host" on public.lobbies
  for update using (host_user_id = auth.uid());

-- lobby_teams: participants can see; host can manage
create policy "lobby_teams_select" on public.lobby_teams
  for select using (
    exists (
      select 1 from public.lobbies l
      where l.id = lobby_teams.lobby_id
        and (l.visibility = 'public'
          or l.host_user_id = auth.uid()
          or exists (
            select 1 from public.lobby_players lp
            where lp.lobby_id = l.id and lp.user_id = auth.uid()
          ))
    )
  );

create policy "lobby_teams_insert_host" on public.lobby_teams
  for insert with check (
    exists (select 1 from public.lobbies l where l.id = lobby_id and l.host_user_id = auth.uid())
  );

create policy "lobby_teams_update_host" on public.lobby_teams
  for update using (
    exists (select 1 from public.lobbies l where l.id = lobby_id and l.host_user_id = auth.uid())
  );

-- lobby_players: participants can see; anyone can join (insert), own row to update
create policy "lobby_players_select" on public.lobby_players
  for select using (
    exists (
      select 1 from public.lobbies l
      where l.id = lobby_players.lobby_id
        and (l.visibility = 'public' or l.host_user_id = auth.uid()
          or exists (
            select 1 from public.lobby_players lp2
            where lp2.lobby_id = l.id and lp2.user_id = auth.uid()
          ))
    )
  );

create policy "lobby_players_insert" on public.lobby_players
  for insert with check (
    user_id = auth.uid() or user_id is null  -- authenticated join or guest
  );

create policy "lobby_players_update_own" on public.lobby_players
  for update using (user_id = auth.uid() or user_id is null);

-- game_state: participants can read; only service role or edge functions mutate
create policy "game_state_select" on public.game_state
  for select using (
    exists (
      select 1 from public.lobbies l
      where l.id = game_state.lobby_id
        and (l.visibility = 'public' or l.host_user_id = auth.uid()
          or exists (
            select 1 from public.lobby_players lp
            where lp.lobby_id = l.id and lp.user_id = auth.uid()
          ))
    )
  );

-- chat_messages: participants can read and insert
create policy "chat_messages_select" on public.chat_messages
  for select using (
    exists (
      select 1 from public.lobby_players lp
      where lp.lobby_id = chat_messages.lobby_id
        and (lp.user_id = auth.uid() or lp.user_id is null)
    )
    or exists (
      select 1 from public.lobbies l
      where l.id = chat_messages.lobby_id and l.visibility = 'public'
    )
  );

create policy "chat_messages_insert" on public.chat_messages
  for insert with check (
    exists (
      select 1 from public.lobby_players lp
      where lp.lobby_id = lobby_id
        and lp.id = sender_player_id
        and (lp.user_id = auth.uid() or lp.user_id is null)
    )
  );

-- guess_log: participants can read; insert for own player row
create policy "guess_log_select" on public.guess_log
  for select using (
    exists (
      select 1 from public.lobby_players lp
      where lp.lobby_id = guess_log.lobby_id and lp.user_id = auth.uid()
    )
  );

create policy "guess_log_insert" on public.guess_log
  for insert with check (
    exists (
      select 1 from public.lobby_players lp
      where lp.id = player_id and lp.user_id = auth.uid()
    )
  );
