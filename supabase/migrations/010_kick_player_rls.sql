-- Allow the lobby host to delete (kick) any player from their lobby.
-- Players can also delete their own row (leave lobby).
create policy "lobby_players_delete" on public.lobby_players
  for delete using (
    user_id = auth.uid()
    or exists (
      select 1 from public.lobbies l
      where l.id = lobby_players.lobby_id
        and l.host_user_id = auth.uid()
    )
  );
