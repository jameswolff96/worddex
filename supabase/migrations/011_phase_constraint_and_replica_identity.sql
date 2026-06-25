-- Add 'correct_guess' to the game_state phase check constraint.
alter table public.game_state drop constraint game_state_phase_check;
alter table public.game_state add constraint game_state_phase_check
  check (phase in ('waiting','turn_start','clueing','correct_guess','turn_end','round_end','game_over'));

-- Set REPLICA IDENTITY FULL on lobby_players so that DELETE events
-- include all column values. Without this, Realtime DELETE payloads
-- only carry the primary key, so filters on lobby_id don't match and
-- kick events are never delivered to subscribed clients.
alter table public.lobby_players replica identity full;
