-- ─────────────────────────────────────────────────────────────
-- Postgres grants EXECUTE to PUBLIC by default for every new
-- function. REVOKE FROM anon/authenticated alone has no effect
-- while PUBLIC still holds the privilege.
-- The correct pattern: REVOKE FROM PUBLIC, then re-GRANT only
-- to the roles that actually need the function.
-- ─────────────────────────────────────────────────────────────

-- Trigger-only functions: called by Postgres triggers, never by
-- any role directly. Remove all REST-callable access.
revoke execute on function public.handle_new_user()       from public;
revoke execute on function public.handle_new_user_stats() from public;

-- Score functions: used only by server actions running as an
-- authenticated user. Keep authenticated, remove anon.
revoke execute on function public.increment_player_score(uuid, integer) from public;
revoke execute on function public.increment_team_score(uuid, integer)   from public;
grant  execute on function public.increment_player_score(uuid, integer) to authenticated;
grant  execute on function public.increment_team_score(uuid, integer)   to authenticated;

-- Lobby code generation: authenticated users only (lobby creation
-- goes through a server action that already enforces auth).
revoke execute on function public.generate_lobby_code() from public;
grant  execute on function public.generate_lobby_code() to authenticated;

-- Discriminator counter: authenticated users only (profile updates).
revoke execute on function public.next_discriminator(text) from public;
grant  execute on function public.next_discriminator(text) to authenticated;

-- is_lobby_participant / is_lobby_host: keep PUBLIC grant.
-- These are called from inside RLS policies. Postgres evaluates
-- them in the context of the requesting role (including anon),
-- so anon needs EXECUTE or lobby SELECT policies break for
-- unauthenticated visitors browsing public lobbies.
-- The linter will continue to warn — that is intentional.

-- ─────────────────────────────────────────────────────────────
-- Remaining warnings that CANNOT be fully resolved:
--
-- authenticated_security_definer_function_executable on score /
-- lobby-code functions: authenticated users CAN call these via
-- REST. Acceptable — they still need a valid session, and the
-- functions only affect rows the player legitimately owns.
--
-- auth_allow_anonymous_sign_ins on game tables: by design.
-- Anonymous sign-in users (guests) are a core feature; blocking
-- them would break the guest-player flow.
--
-- auth_leaked_password_protection: dismiss in the Supabase
-- dashboard — password sign-in is disabled on this project.
-- ─────────────────────────────────────────────────────────────
