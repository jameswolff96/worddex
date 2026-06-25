-- discriminator_counters is an internal counter table accessed only by the
-- next_discriminator() SECURITY DEFINER function, which bypasses RLS.
-- No role should ever query or mutate it directly; the explicit deny policy
-- makes that intent clear and satisfies the rls_enabled_no_policy linter.
create policy "discriminator_counters_internal_only" on public.discriminator_counters
  as restrictive
  for all
  using (false);
