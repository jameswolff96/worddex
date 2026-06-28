-- Split the single 'Pokémon' category into per-generation categories based on
-- National Pokédex number (stored as sprite_ref text).
-- Gen ranges follow the official National Dex groupings.

-- Rows with a known dex number: assign by range
UPDATE public.word_bank
SET category = CASE
  WHEN sprite_ref::integer BETWEEN   1 AND  151 THEN 'Pokémon Gen 1'
  WHEN sprite_ref::integer BETWEEN 152 AND  251 THEN 'Pokémon Gen 2'
  WHEN sprite_ref::integer BETWEEN 252 AND  386 THEN 'Pokémon Gen 3'
  WHEN sprite_ref::integer BETWEEN 387 AND  493 THEN 'Pokémon Gen 4'
  WHEN sprite_ref::integer BETWEEN 494 AND  649 THEN 'Pokémon Gen 5'
  WHEN sprite_ref::integer BETWEEN 650 AND  721 THEN 'Pokémon Gen 6'
  WHEN sprite_ref::integer BETWEEN 722 AND  809 THEN 'Pokémon Gen 7'
  WHEN sprite_ref::integer BETWEEN 810 AND  905 THEN 'Pokémon Gen 8'
  WHEN sprite_ref::integer BETWEEN 906 AND 1025 THEN 'Pokémon Gen 9'
  ELSE 'Pokémon Gen 1'
END
WHERE category = 'Pokémon'
  AND sprite_ref IS NOT NULL
  AND sprite_ref ~ '^\d+$';

-- Safety net: any remaining 'Pokémon' rows with no/non-numeric sprite_ref → Gen 1
UPDATE public.word_bank
SET category = 'Pokémon Gen 1'
WHERE category = 'Pokémon';
