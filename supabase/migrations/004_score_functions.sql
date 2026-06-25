-- Atomic score increment for solo-mode player scores
create or replace function public.increment_player_score(
  p_player_id uuid,
  p_amount    integer
) returns void language plpgsql security definer as $$
begin
  update public.lobby_players
    set score = score + p_amount
    where id = p_player_id;
end;
$$;

-- Atomic score increment for team scores
create or replace function public.increment_team_score(
  p_team_id uuid,
  p_amount  integer
) returns void language plpgsql security definer as $$
begin
  update public.lobby_teams
    set score = score + p_amount
    where id = p_team_id;
end;
$$;
