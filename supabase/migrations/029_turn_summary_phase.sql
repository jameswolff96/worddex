-- Add turn_summary phase: sits between clueing and turn_end, shows
-- animated scores while bonus points are awarded via Realtime.
alter table public.game_state drop constraint game_state_phase_check;
alter table public.game_state add constraint game_state_phase_check
  check (phase in ('waiting','turn_start','clueing','correct_guess','turn_summary','turn_end','round_end','game_over'));
