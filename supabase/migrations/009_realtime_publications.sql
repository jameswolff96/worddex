-- Add lobby_teams to the supabase_realtime publication so team score
-- updates are streamed to clients. lobby_players and other tables should
-- already be added; this is idempotent (alter publication ... add table
-- silently no-ops if the table is already a member in Postgres 15+).
alter publication supabase_realtime add table public.lobbies;
alter publication supabase_realtime add table public.lobby_players;
alter publication supabase_realtime add table public.game_state;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.lobby_teams;
