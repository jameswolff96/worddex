-- Revert the users SELECT policy to public read.
-- Migration 012 tightened it to require auth.uid() is not null, which broke
-- the lobby page for unauthenticated visitors: the lobby_players → users join
-- returned null display_name/discriminator/avatar for anyone without a session.
-- display_name, discriminator, and avatar are non-sensitive public profile data.

drop policy if exists "users_select_all" on public.users;

create policy "users_select_all" on public.users
  for select using (true);
