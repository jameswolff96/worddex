-- Automatically delete anonymous users and their data after 30 days of inactivity.
-- "Inactivity" = last_sign_in_at on auth.users is older than 30 days.
--
-- Deletion order matters:
--  1. Lobbies hosted by the stale anon user (cascades to lobby_players, lobby_teams,
--     game_state, chat_messages, guess_log for those lobbies).
--  2. lobby_players rows where the user joined someone else's lobby
--     (avoids a constraint violation — lobby_players.user_id is ON DELETE SET NULL,
--     and guest_name is NULL for anon users, which would break player_has_identity).
--  3. auth.users rows (cascades to public.users, public.stats).
--
-- Requires pg_cron for scheduling. On free tier (no pg_cron), call this function
-- manually or from a scheduled Edge Function.

create or replace function public.cleanup_anon_users()
returns integer
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_count integer;
begin
  -- 1. Delete lobbies the stale anon user hosted (full cascade)
  delete from public.lobbies l
  using auth.users au
  join public.users pu on pu.id = au.id
  where l.host_user_id = pu.id
    and au.is_anonymous = true
    and au.last_sign_in_at < now() - interval '30 days';

  -- 2. Remove their lobby_players rows in other lobbies
  delete from public.lobby_players lp
  using auth.users au
  where lp.user_id = au.id
    and au.is_anonymous = true
    and au.last_sign_in_at < now() - interval '30 days';

  -- 3. Delete the auth users (cascades to public.users → public.stats)
  delete from auth.users au
  where au.is_anonymous = true
    and au.last_sign_in_at < now() - interval '30 days';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Only the Postgres superuser (service role) should call this directly.
revoke execute on function public.cleanup_anon_users() from public;
revoke execute on function public.cleanup_anon_users() from authenticated;
revoke execute on function public.cleanup_anon_users() from anon;

-- Schedule nightly at 03:00 UTC if pg_cron is available (Supabase Pro+).
-- On free tier, skip this block and call the function from a scheduled Edge Function.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'cleanup-anon-users',
      '0 3 * * *',
      $cron$ select public.cleanup_anon_users(); $cron$
    );
  end if;
end;
$$;
