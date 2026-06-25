-- Populate sprite_ref for all Pokémon in the word bank.
-- Values are National Pokédex numbers stored as text, matching the
-- format used by users.avatar and pokemonSpriteUrl().
-- Sprite URL: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png

update public.word_bank
set sprite_ref = case term
  -- Gen 1
  when 'Bulbasaur'    then '1'
  when 'Charizard'    then '6'
  when 'Squirtle'     then '7'
  when 'Pikachu'      then '25'
  when 'Jigglypuff'   then '39'
  when 'Alakazam'     then '65'
  when 'Machamp'      then '68'
  when 'Gengar'       then '94'
  when 'Onix'         then '95'
  when 'Scyther'      then '123'
  when 'Tauros'       then '128'
  when 'Magikarp'     then '129'
  when 'Gyarados'     then '130'
  when 'Lapras'       then '131'
  when 'Ditto'        then '132'
  when 'Eevee'        then '133'
  when 'Vaporeon'     then '134'
  when 'Snorlax'      then '143'
  when 'Dragonite'    then '149'
  when 'Mewtwo'       then '150'
  when 'Mew'          then '151'
  -- Gen 2
  when 'Espeon'       then '196'
  when 'Umbreon'      then '197'
  when 'Skarmory'     then '227'
  when 'Tyranitar'    then '248'
  when 'Celebi'       then '251'
  -- Gen 3
  when 'Sceptile'     then '254'
  when 'Blaziken'     then '257'
  when 'Swampert'     then '260'
  when 'Gardevoir'    then '282'
  when 'Aggron'       then '306'
  when 'Banette'      then '354'
  when 'Absol'        then '359'
  when 'Salamence'    then '373'
  when 'Metagross'    then '376'
  when 'Kyogre'       then '382'
  when 'Groudon'      then '383'
  when 'Rayquaza'     then '384'
  -- Gen 4
  when 'Garchomp'     then '445'
  when 'Lucario'      then '448'
  when 'Heatran'      then '485'
  when 'Darkrai'      then '491'
  when 'Arceus'       then '493'
  -- Gen 5
  when 'Zoroark'      then '571'
  when 'Hydreigon'    then '635'
  -- Gen 6
  when 'Greninja'     then '658'
  when 'Goodra'       then '706'
  when 'Sylveon'      then '700'
  -- Gen 7
  when 'Decidueye'    then '724'
  when 'Incineroar'   then '727'
  when 'Primarina'    then '730'
  when 'Lycanroc'     then '745'
  when 'Toxapex'      then '748'
  when 'Mimikyu'      then '778'
  -- Gen 8
  when 'Corviknight'  then '823'
  when 'Cinderace'    then '815'
  when 'Sandaconda'   then '844'
  when 'Dragapult'    then '887'
  when 'Zacian'       then '888'
  when 'Eternatus'    then '890'
end
where category = 'Pokémon';
