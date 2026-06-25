-- Helper: is the current user the host of a given lobby?
-- SECURITY DEFINER reads lobbies without RLS, avoiding the
-- lobby_players ↔ lobbies policy cycle.
create or replace function public.is_lobby_host(p_lobby_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.lobbies
    where id = p_lobby_id and host_user_id = auth.uid()
  );
$$;

grant execute on function public.is_lobby_host(uuid) to authenticated, anon;

-- Allow host to kick players, or players to leave themselves.
create policy "lobby_players_delete" on public.lobby_players
  for delete using (
    user_id = auth.uid()
    or public.is_lobby_host(lobby_id)
  );
