-- ─────────────────────────────────────────────────────────────
-- 1. Fix mutable search_path on all security-definer functions.
--    Without this, a malicious schema earlier in the path could
--    shadow public objects inside a SECURITY DEFINER context.
-- ─────────────────────────────────────────────────────────────
alter function public.handle_new_user()                        set search_path = 'public';
alter function public.handle_new_user_stats()                  set search_path = 'public';
alter function public.next_discriminator(text)                 set search_path = 'public';
alter function public.generate_lobby_code()                    set search_path = 'public';
alter function public.increment_player_score(uuid, integer)    set search_path = 'public';
alter function public.increment_team_score(uuid, integer)      set search_path = 'public';
alter function public.is_lobby_participant(uuid)               set search_path = 'public';
alter function public.is_lobby_host(uuid)                      set search_path = 'public';

-- ─────────────────────────────────────────────────────────────
-- 2. Lock down EXECUTE privileges.
--
--    Trigger-only functions (handle_new_user, handle_new_user_stats)
--    are invoked by Postgres triggers, never by a role directly.
--    Revoking from everyone prevents REST API abuse.
--
--    Score functions are SECURITY DEFINER (to bypass lobby_teams RLS).
--    Leaving them callable by anon lets any unauthenticated request
--    give arbitrary players/teams unlimited points — revoke from anon.
--
--    is_lobby_participant / is_lobby_host are called from inside RLS
--    policies, so Postgres needs the anon role to be able to execute
--    them. Keep anon EXECUTE on those two.
-- ─────────────────────────────────────────────────────────────

-- Trigger-only: revoke from all roles
revoke execute on function public.handle_new_user()         from anon, authenticated;
revoke execute on function public.handle_new_user_stats()   from anon, authenticated;

-- Score manipulation: authenticated only (called from server actions)
revoke execute on function public.increment_player_score(uuid, integer) from anon;
revoke execute on function public.increment_team_score(uuid, integer)   from anon;

-- Lobby code generation: authenticated only (requires login to create lobby)
revoke execute on function public.generate_lobby_code() from anon;

-- Discriminator: authenticated only (profile creation/update)
revoke execute on function public.next_discriminator(text) from anon;

-- ─────────────────────────────────────────────────────────────
-- 3. Tighten RLS policies that exposed sensitive data to the
--    completely-unauthenticated anon role.
--
--    Supabase anonymous-auth users have the `authenticated` role
--    and a valid auth.uid(), so these changes don't affect them.
--    Only truly unauthenticated requests (no JWT at all) are blocked.
-- ─────────────────────────────────────────────────────────────

-- User profiles: require a signed-in session (anonymous auth included)
drop policy if exists "users_select_all" on public.users;
create policy "users_select_all" on public.users
  for select using (auth.uid() is not null);

-- Stats: same
drop policy if exists "stats_select_all" on public.stats;
create policy "stats_select_all" on public.stats
  for select using (auth.uid() is not null);

-- lobby_players insert: require authenticated session, user_id must match caller.
-- The old `user_id is null` branch was a leftover from before anonymous auth;
-- guests now always get a real auth.uid() via signInAnonymously().
drop policy if exists "lobby_players_insert" on public.lobby_players;
create policy "lobby_players_insert" on public.lobby_players
  for insert with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );

-- Note: auth_leaked_password_protection warning can be dismissed —
-- this project uses OAuth only; no password sign-in is enabled.
