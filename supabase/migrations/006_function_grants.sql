-- Recreate generate_lobby_code as security definer so:
--   1. The uniqueness check sees ALL lobbies (bypasses RLS)
--   2. Authenticated users can actually call it
create or replace function public.generate_lobby_code()
returns text language plpgsql security definer as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text;
begin
  loop
    code := '';
    for i in 1..5 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.lobbies where lobbies.code = code);
  end loop;
  return code;
end;
$$;

-- Explicit grants in case the project has revoked public execute
grant execute on function public.generate_lobby_code()       to authenticated;
grant execute on function public.next_discriminator(text)    to authenticated;
grant execute on function public.increment_player_score(uuid, integer) to authenticated;
grant execute on function public.increment_team_score(uuid, integer)   to authenticated;
