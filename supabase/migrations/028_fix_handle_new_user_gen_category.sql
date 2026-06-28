-- Migration 026 renamed category 'Pokémon' → 'Pokémon Gen 1'–'Pokémon Gen 9'.
-- The handle_new_user trigger was still filtering category = 'Pokémon', which
-- now matches nothing, leaving v_display_name NULL and crashing next_discriminator.
-- Fix: match any Pokémon generation category.

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
       where category like 'Pokémon Gen %' and is_active
       order by random() limit 1
    ) w
    order by random() limit 1;

  -- Fallback in case word_bank or adjectives is empty
  if v_display_name is null then
    v_display_name := 'Trainer' || floor(random() * 9000 + 1000)::text;
  end if;

  v_disc := public.next_discriminator(v_display_name);

  insert into public.users(id, email, display_name, discriminator, avatar)
    values (
      new.id,
      new.email,
      v_display_name,
      v_disc,
      (floor(random() * 151) + 1)::text
    )
    on conflict (id) do nothing;

  return new;
end;
$$;
