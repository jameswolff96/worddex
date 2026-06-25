-- game_state: host can insert, any participant can update
-- (submitClue / endTurn / advanceTurn etc. all update from different players)
create policy "game_state_insert" on public.game_state
  for insert with check (
    exists (
      select 1 from public.lobbies
      where id = lobby_id and host_user_id = auth.uid()
    )
  );

create policy "game_state_update" on public.game_state
  for update using (
    exists (
      select 1 from public.lobby_players lp
      where lp.lobby_id = game_state.lobby_id
        and lp.user_id = auth.uid()
    )
  );

-- chat_messages: existing policy breaks on system messages (sender_player_id = NULL)
-- Allow: clue/guess with valid sender, OR system with null sender from any participant
drop policy if exists "chat_messages_insert" on public.chat_messages;
create policy "chat_messages_insert" on public.chat_messages
  for insert with check (
    (
      kind in ('clue', 'guess')
      and exists (
        select 1 from public.lobby_players lp
        where lp.lobby_id = lobby_id
          and lp.id = sender_player_id
          and (lp.user_id = auth.uid() or lp.user_id is null)
      )
    )
    or
    (
      kind = 'system'
      and sender_player_id is null
      and exists (
        select 1 from public.lobby_players lp
        where lp.lobby_id = lobby_id
          and lp.user_id = auth.uid()
      )
    )
  );
