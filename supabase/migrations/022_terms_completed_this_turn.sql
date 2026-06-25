-- Track how many terms the current clue master has completed this turn
-- so the engine can enforce the terms_per_turn rule.
alter table public.game_state
  add column if not exists terms_completed_this_turn integer not null default 0;
