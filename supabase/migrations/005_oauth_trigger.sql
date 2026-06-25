-- Update handle_new_user to pick up full_name / name from OAuth providers
-- (Google and Discord supply full_name; email provider supplied display_name)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_display_name text;
  v_disc         integer;
begin
  select a.word || ' ' || w.term
    into v_display_name
    from public.adjectives a
    cross join lateral (
      select term from public.word_bank
       where category = 'Pokémon' and is_active
       order by random() limit 1
    ) w
    order by random() limit 1;

  v_disc := public.next_discriminator(v_display_name);

  insert into public.users(id, email, display_name, discriminator, avatar)
    values (
      new.id,
      new.email,
      v_display_name,
      v_disc,
      coalesce(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture'
      )
    )
    on conflict (id) do nothing;

  return new;
end;
$$;
