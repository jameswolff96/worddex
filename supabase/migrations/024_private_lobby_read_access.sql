-- Allow anyone (including unauthenticated) to read lobby data.
-- Private lobbies use the lobby code as the access credential, so
-- SELECT should not be gated on prior membership — that would block
-- the join flow for users who have the code but are not yet members.

-- lobbies: open SELECT to all roles
drop policy if exists "lobbies_select_public" on public.lobbies;
create policy "lobbies_select_public" on public.lobbies
  for select using (true);

-- lobby_players: readable whenever the parent lobby is readable
drop policy if exists "lobby_players_select" on public.lobby_players;
create policy "lobby_players_select" on public.lobby_players
  for select using (
    exists (select 1 from public.lobbies where id = lobby_players.lobby_id)
  );

-- lobby_teams: readable whenever the parent lobby is readable
drop policy if exists "lobby_teams_select" on public.lobby_teams;
create policy "lobby_teams_select" on public.lobby_teams
  for select using (
    exists (select 1 from public.lobbies where id = lobby_teams.lobby_id)
  );
