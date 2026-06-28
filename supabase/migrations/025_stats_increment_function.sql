-- Atomically increment one or more stat counters for a registered user.
-- Called from engine.ts at correct-guess time and game-over time.
create or replace function public.increment_stat(
  p_user_id       uuid,
  p_games_played  integer default 0,
  p_games_won     integer default 0,
  p_terms_guessed integer default 0
) returns void language plpgsql security definer as $$
begin
  update public.stats
  set
    games_played  = games_played  + p_games_played,
    games_won     = games_won     + p_games_won,
    terms_guessed = terms_guessed + p_terms_guessed
  where user_id = p_user_id;
end;
$$;

grant execute on function public.increment_stat(uuid, integer, integer, integer) to authenticated;
