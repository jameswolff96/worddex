-- Per-player persistent word banks for FFA rotation mode.
-- player_word_banks: { [lobby_player_id]: { slot_grid: SlotCell[], used_words: string[] } }
-- player_term_counts: { [lobby_player_id]: number } — terms clued per player this round
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS player_word_banks  jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS player_term_counts jsonb NOT NULL DEFAULT '{}';
