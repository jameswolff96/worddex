-- Add covering indexes for foreign key columns that were missing them.
-- Without these, ON DELETE / ON UPDATE FK enforcement and any join that
-- references these columns from the child side requires a sequential scan.

create index if not exists chat_messages_sender_player_id_idx
  on public.chat_messages(sender_player_id);

create index if not exists game_state_current_turn_player_id_idx
  on public.game_state(current_turn_player_id);

create index if not exists game_state_current_team_id_idx
  on public.game_state(current_team_id);

create index if not exists guess_log_player_id_idx
  on public.guess_log(player_id);

create index if not exists lobbies_host_user_id_idx
  on public.lobbies(host_user_id);

create index if not exists lobby_players_team_id_idx
  on public.lobby_players(team_id)
  where team_id is not null;
