-- Cancel lobbies that have been waiting for more than 30 minutes without starting.
create or replace function public.cleanup_stale_lobbies()
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  update public.lobbies
  set status = 'finished'
  where status = 'waiting'
    and created_at < now() - interval '30 minutes';
end;
$$;

-- Prevent direct invocation by untrusted roles.
revoke all on function public.cleanup_stale_lobbies() from public, authenticated, anon;

-- Schedule every 5 minutes if pg_cron is available (Supabase Pro+).
-- On free tier, call this function from a scheduled Supabase Edge Function instead.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'cleanup-stale-lobbies',
      '*/5 * * * *',
      'select public.cleanup_stale_lobbies()'
    );
  end if;
end $$;
