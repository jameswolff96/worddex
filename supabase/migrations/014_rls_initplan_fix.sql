-- Replace auth.uid() with (select auth.uid()) in every RLS policy.
-- Postgres treats the bare call as a volatile function and re-evaluates
-- it for every row. Wrapping it in a subselect hoists it to an init-plan
-- that runs once per statement — equivalent result, far cheaper at scale.

-- ── public.users ─────────────────────────────────────────────

drop policy if exists "users_select_all"  on public.users;
drop policy if exists "users_update_own"  on public.users;

create policy "users_select_all" on public.users
  for select using ((select auth.uid()) is not null);

create policy "users_update_own" on public.users
  for update using ((select auth.uid()) = id);

-- ── public.stats ─────────────────────────────────────────────

drop policy if exists "stats_select_all"  on public.stats;
drop policy if exists "stats_update_own"  on public.stats;

create policy "stats_select_all" on public.stats
  for select using ((select auth.uid()) is not null);

create policy "stats_update_own" on public.stats
  for update using ((select auth.uid()) = user_id);

-- ── public.lobbies ────────────────────────────────────────────

drop policy if exists "lobbies_select_public" on public.lobbies;
drop policy if exists "lobbies_insert_auth"   on public.lobbies;
drop policy if exists "lobbies_update_host"   on public.lobbies;

create policy "lobbies_select_public" on public.lobbies
  for select using (
    visibility = 'public'
    or host_user_id = (select auth.uid())
    or public.is_lobby_participant(id)
  );

create policy "lobbies_insert_auth" on public.lobbies
  for insert with check (
    (select auth.uid()) is not null
    and host_user_id = (select auth.uid())
  );

create policy "lobbies_update_host" on public.lobbies
  for update using (host_user_id = (select auth.uid()));

-- ── public.lobby_teams ────────────────────────────────────────

drop policy if exists "lobby_teams_select"      on public.lobby_teams;
drop policy if exists "lobby_teams_insert_host" on public.lobby_teams;
drop policy if exists "lobby_teams_update_host" on public.lobby_teams;

create policy "lobby_teams_select" on public.lobby_teams
  for select using (
    exists (
      select 1 from public.lobbies l
      where l.id = lobby_teams.lobby_id
        and (
          l.visibility = 'public'
          or l.host_user_id = (select auth.uid())
          or exists (
            select 1 from public.lobby_players lp
            where lp.lobby_id = l.id
              and lp.user_id = (select auth.uid())
          )
        )
    )
  );

create policy "lobby_teams_insert_host" on public.lobby_teams
  for insert with check (
    exists (
      select 1 from public.lobbies l
      where l.id = lobby_id
        and l.host_user_id = (select auth.uid())
    )
  );

create policy "lobby_teams_update_host" on public.lobby_teams
  for update using (
    exists (
      select 1 from public.lobbies l
      where l.id = lobby_id
        and l.host_user_id = (select auth.uid())
    )
  );

-- ── public.lobby_players ──────────────────────────────────────

drop policy if exists "lobby_players_insert"     on public.lobby_players;
drop policy if exists "lobby_players_update_own" on public.lobby_players;
drop policy if exists "lobby_players_delete"     on public.lobby_players;

create policy "lobby_players_insert" on public.lobby_players
  for insert with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

create policy "lobby_players_update_own" on public.lobby_players
  for update using (user_id = (select auth.uid()) or user_id is null);

create policy "lobby_players_delete" on public.lobby_players
  for delete using (
    user_id = (select auth.uid())
    or public.is_lobby_host(lobby_id)
  );

-- ── public.game_state ─────────────────────────────────────────

drop policy if exists "game_state_select" on public.game_state;
drop policy if exists "game_state_insert" on public.game_state;
drop policy if exists "game_state_update" on public.game_state;

create policy "game_state_select" on public.game_state
  for select using (
    exists (
      select 1 from public.lobbies l
      where l.id = game_state.lobby_id
        and (
          l.visibility = 'public'
          or l.host_user_id = (select auth.uid())
          or exists (
            select 1 from public.lobby_players lp
            where lp.lobby_id = l.id
              and lp.user_id = (select auth.uid())
          )
        )
    )
  );

create policy "game_state_insert" on public.game_state
  for insert with check (
    exists (
      select 1 from public.lobbies
      where id = lobby_id
        and host_user_id = (select auth.uid())
    )
  );

create policy "game_state_update" on public.game_state
  for update using (
    exists (
      select 1 from public.lobby_players lp
      where lp.lobby_id = game_state.lobby_id
        and lp.user_id = (select auth.uid())
    )
  );

-- ── public.chat_messages ──────────────────────────────────────

drop policy if exists "chat_messages_select" on public.chat_messages;
drop policy if exists "chat_messages_insert" on public.chat_messages;

create policy "chat_messages_select" on public.chat_messages
  for select using (
    exists (
      select 1 from public.lobby_players lp
      where lp.lobby_id = chat_messages.lobby_id
        and (lp.user_id = (select auth.uid()) or lp.user_id is null)
    )
    or exists (
      select 1 from public.lobbies l
      where l.id = chat_messages.lobby_id and l.visibility = 'public'
    )
  );

create policy "chat_messages_insert" on public.chat_messages
  for insert with check (
    (
      kind in ('clue', 'guess')
      and exists (
        select 1 from public.lobby_players lp
        where lp.lobby_id = lobby_id
          and lp.id = sender_player_id
          and (lp.user_id = (select auth.uid()) or lp.user_id is null)
      )
    )
    or
    (
      kind = 'system'
      and sender_player_id is null
      and exists (
        select 1 from public.lobby_players lp
        where lp.lobby_id = lobby_id
          and lp.user_id = (select auth.uid())
      )
    )
  );

-- ── public.guess_log ──────────────────────────────────────────

drop policy if exists "guess_log_select" on public.guess_log;
drop policy if exists "guess_log_insert" on public.guess_log;

create policy "guess_log_select" on public.guess_log
  for select using (
    exists (
      select 1 from public.lobby_players lp
      where lp.lobby_id = guess_log.lobby_id
        and lp.user_id = (select auth.uid())
    )
  );

create policy "guess_log_insert" on public.guess_log
  for insert with check (
    exists (
      select 1 from public.lobby_players lp
      where lp.id = player_id
        and lp.user_id = (select auth.uid())
    )
  );
