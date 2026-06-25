-- ── Fix 1: generate_lobby_code variable name clashes with lobbies.code column ──
create or replace function public.generate_lobby_code()
returns text language plpgsql security definer as $$
declare
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..5 loop
      v_code := v_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.lobbies where code = v_code);
  end loop;
  return v_code;
end;
$$;

grant execute on function public.generate_lobby_code() to authenticated;

-- ── Fix 2: break lobby_players ↔ lobbies RLS cycle ──
-- A security definer function checks lobby_players WITHOUT triggering its RLS,
-- so the lobbies policy can call this without recursive re-entry.
create or replace function public.is_lobby_participant(p_lobby_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.lobby_players
    where lobby_id = p_lobby_id and user_id = auth.uid()
  );
$$;

grant execute on function public.is_lobby_participant(uuid) to authenticated, anon;

-- Recreate lobbies select policy using the helper instead of a direct subquery
drop policy if exists "lobbies_select_public" on public.lobbies;
create policy "lobbies_select_public" on public.lobbies
  for select using (
    visibility = 'public'
    or host_user_id = auth.uid()
    or public.is_lobby_participant(id)
  );

-- Recreate lobby_players select policy — just check the lobby is visible to
-- this user via lobbies RLS (which now uses the helper, breaking the cycle).
drop policy if exists "lobby_players_select" on public.lobby_players;
create policy "lobby_players_select" on public.lobby_players
  for select using (
    exists (
      select 1 from public.lobbies l
      where l.id = lobby_players.lobby_id
    )
  );
