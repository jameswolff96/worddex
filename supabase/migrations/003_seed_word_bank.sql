-- ─────────────────────────────────────────────────────────────
-- Word bank seed (from pokemon-25-words.html)
-- ─────────────────────────────────────────────────────────────

insert into public.word_bank (term, category) values
-- Pokémon
('Pikachu','Pokémon'), ('Charizard','Pokémon'), ('Bulbasaur','Pokémon'), ('Squirtle','Pokémon'),
('Mewtwo','Pokémon'), ('Gengar','Pokémon'), ('Snorlax','Pokémon'), ('Eevee','Pokémon'),
('Gyarados','Pokémon'), ('Jigglypuff','Pokémon'), ('Machamp','Pokémon'), ('Lapras','Pokémon'),
('Onix','Pokémon'), ('Dragonite','Pokémon'), ('Ditto','Pokémon'), ('Alakazam','Pokémon'),
('Magikarp','Pokémon'), ('Vaporeon','Pokémon'), ('Scyther','Pokémon'), ('Tauros','Pokémon'),
('Lucario','Pokémon'), ('Garchomp','Pokémon'), ('Greninja','Pokémon'), ('Sylveon','Pokémon'),
('Tyranitar','Pokémon'), ('Metagross','Pokémon'), ('Rayquaza','Pokémon'), ('Groudon','Pokémon'),
('Kyogre','Pokémon'), ('Mew','Pokémon'), ('Celebi','Pokémon'), ('Absol','Pokémon'),
('Umbreon','Pokémon'), ('Espeon','Pokémon'), ('Blaziken','Pokémon'), ('Swampert','Pokémon'),
('Sceptile','Pokémon'), ('Gardevoir','Pokémon'), ('Salamence','Pokémon'), ('Aggron','Pokémon'),
('Banette','Pokémon'), ('Skarmory','Pokémon'), ('Heatran','Pokémon'), ('Darkrai','Pokémon'),
('Arceus','Pokémon'), ('Zoroark','Pokémon'), ('Hydreigon','Pokémon'), ('Goodra','Pokémon'),
('Decidueye','Pokémon'), ('Incineroar','Pokémon'), ('Primarina','Pokémon'), ('Lycanroc','Pokémon'),
('Toxapex','Pokémon'), ('Mimikyu','Pokémon'), ('Corviknight','Pokémon'), ('Dragapult','Pokémon'),
('Cinderace','Pokémon'), ('Zacian','Pokémon'), ('Eternatus','Pokémon'), ('Sandaconda','Pokémon'),

-- Items
('Poké Ball','Items'), ('Master Ball','Items'), ('Potion','Items'), ('Antidote','Items'),
('Revive','Items'), ('Rare Candy','Items'), ('Moon Stone','Items'), ('Thunder Stone','Items'),
('Leftovers','Items'), ('Choice Band','Items'), ('Focus Sash','Items'), ('Lucky Egg','Items'),
('Exp. Share','Items'), ('Bicycle','Items'), ('Town Map','Items'), ('Escape Rope','Items'),
('Repel','Items'), ('Full Restore','Items'), ('Berry Juice','Items'), ('Amulet Coin','Items'),
('Soothe Bell','Items'), ('X Speed','Items'), ('TM','Items'), ('Fishing Rod','Items'),
('Silph Scope','Items'), ('Old Rod','Items'), ('Bike Voucher','Items'), ('HM Cut','Items'),
('Pokédex','Items'), ('Egg Incubator','Items'), ('Z-Crystal','Items'), ('Dynamax Band','Items'),
('Rotom Phone','Items'), ('PP Up','Items'), ('Heart Scale','Items'),

-- Gym Leaders
('Brock','Gym Leaders'), ('Misty','Gym Leaders'), ('Lt. Surge','Gym Leaders'), ('Erika','Gym Leaders'),
('Koga','Gym Leaders'), ('Sabrina','Gym Leaders'), ('Blaine','Gym Leaders'), ('Giovanni','Gym Leaders'),
('Falkner','Gym Leaders'), ('Bugsy','Gym Leaders'), ('Whitney','Gym Leaders'), ('Morty','Gym Leaders'),
('Chuck','Gym Leaders'), ('Jasmine','Gym Leaders'), ('Pryce','Gym Leaders'), ('Clair','Gym Leaders'),
('Roxanne','Gym Leaders'), ('Brawly','Gym Leaders'), ('Wattson','Gym Leaders'), ('Flannery','Gym Leaders'),
('Norman','Gym Leaders'), ('Winona','Gym Leaders'), ('Tate and Liza','Gym Leaders'), ('Wallace','Gym Leaders'),
('Roark','Gym Leaders'), ('Gardenia','Gym Leaders'), ('Maylene','Gym Leaders'), ('Crasher Wake','Gym Leaders'),
('Fantina','Gym Leaders'), ('Byron','Gym Leaders'), ('Candice','Gym Leaders'), ('Volkner','Gym Leaders'),
('Viola','Gym Leaders'), ('Grant','Gym Leaders'), ('Korrina','Gym Leaders'), ('Ramos','Gym Leaders'),
('Clemont','Gym Leaders'), ('Valerie','Gym Leaders'), ('Olympia','Gym Leaders'), ('Wulfric','Gym Leaders'),
('Milo','Gym Leaders'), ('Nessa','Gym Leaders'), ('Kabu','Gym Leaders'), ('Bea','Gym Leaders'),
('Allister','Gym Leaders'), ('Opal','Gym Leaders'), ('Gordie','Gym Leaders'), ('Melony','Gym Leaders'),
('Piers','Gym Leaders'), ('Raihan','Gym Leaders'),

-- Games
('Red','Games'), ('Blue','Games'), ('Yellow','Games'), ('Gold','Games'), ('Silver','Games'),
('Crystal','Games'), ('Ruby','Games'), ('Sapphire','Games'), ('Emerald','Games'), ('FireRed','Games'),
('LeafGreen','Games'), ('Diamond','Games'), ('Pearl','Games'), ('Platinum','Games'), ('HeartGold','Games'),
('SoulSilver','Games'), ('Black','Games'), ('White','Games'), ('X','Games'), ('Y','Games'),
('Sun','Games'), ('Moon','Games'), ('Ultra Sun','Games'), ('Let''s Go Pikachu','Games'),
('Sword','Games'), ('Shield','Games'), ('Brilliant Diamond','Games'), ('Legends Arceus','Games'),
('Scarlet','Games'), ('Violet','Games'), ('Pokémon Go','Games'), ('Pokémon Snap','Games'),
('Pokémon Stadium','Games'), ('Pokémon Colosseum','Games'), ('Pokémon XD','Games'),

-- Towns & Cities
('Pallet Town','Towns & Cities'), ('Viridian City','Towns & Cities'), ('Pewter City','Towns & Cities'),
('Cerulean City','Towns & Cities'), ('Vermilion City','Towns & Cities'), ('Lavender Town','Towns & Cities'),
('Celadon City','Towns & Cities'), ('Fuchsia City','Towns & Cities'), ('Saffron City','Towns & Cities'),
('Cinnabar Island','Towns & Cities'), ('New Bark Town','Towns & Cities'), ('Cherrygrove City','Towns & Cities'),
('Violet City','Towns & Cities'), ('Goldenrod City','Towns & Cities'), ('Ecruteak City','Towns & Cities'),
('Olivine City','Towns & Cities'), ('Blackthorn City','Towns & Cities'), ('Littleroot Town','Towns & Cities'),
('Oldale Town','Towns & Cities'), ('Petalburg City','Towns & Cities'), ('Rustboro City','Towns & Cities'),
('Mauville City','Towns & Cities'), ('Slateport City','Towns & Cities'), ('Lilycove City','Towns & Cities'),
('Fortree City','Towns & Cities'), ('Sootopolis City','Towns & Cities'), ('Twinleaf Town','Towns & Cities'),
('Jubilife City','Towns & Cities'), ('Sandgem Town','Towns & Cities'), ('Eterna City','Towns & Cities'),
('Hearthome City','Towns & Cities'), ('Snowpoint City','Towns & Cities'), ('Sunyshore City','Towns & Cities'),
('Castelia City','Towns & Cities'), ('Nimbasa City','Towns & Cities'), ('Lumiose City','Towns & Cities'),
('Hau''oli City','Towns & Cities'), ('Iki Town','Towns & Cities'),

-- Routes & Areas
('Route 1','Routes & Areas'), ('Route 22','Routes & Areas'), ('Viridian Forest','Routes & Areas'),
('Mt. Moon','Routes & Areas'), ('Rock Tunnel','Routes & Areas'), ('Victory Road','Routes & Areas'),
('Cerulean Cave','Routes & Areas'), ('Diglett''s Cave','Routes & Areas'), ('Seafoam Islands','Routes & Areas'),
('Power Plant','Routes & Areas'), ('Pokémon Tower','Routes & Areas'), ('Safari Zone','Routes & Areas'),
('Ilex Forest','Routes & Areas'), ('Dragon''s Den','Routes & Areas'), ('Whirl Islands','Routes & Areas'),
('Petalburg Woods','Routes & Areas'), ('Granite Cave','Routes & Areas'), ('Mt. Pyre','Routes & Areas'),
('Sky Pillar','Routes & Areas'), ('Eterna Forest','Routes & Areas'), ('Mt. Coronet','Routes & Areas'),
('Iron Island','Routes & Areas'), ('Spear Pillar','Routes & Areas'), ('Pinwheel Forest','Routes & Areas'),
('Chargestone Cave','Routes & Areas'), ('Reflection Cave','Routes & Areas'), ('Lumiose Sewers','Routes & Areas'),
('Wild Area','Routes & Areas'), ('Hammerlocke Hills','Routes & Areas'), ('Galar Mine','Routes & Areas');

-- ─────────────────────────────────────────────────────────────
-- Adjectives seed (for auto-generated display names)
-- ─────────────────────────────────────────────────────────────
insert into public.adjectives (word) values
('Swift'), ('Mysterious'), ('Clever'), ('Ancient'), ('Bold'),
('Calm'), ('Daring'), ('Eager'), ('Fierce'), ('Gentle'),
('Hardy'), ('Hasty'), ('Impish'), ('Jolly'), ('Keen'),
('Lax'), ('Lonely'), ('Lucky'), ('Mild'), ('Modest'),
('Naive'), ('Naughty'), ('Quiet'), ('Quirky'), ('Rash'),
('Relaxed'), ('Sassy'), ('Serious'), ('Timid'), ('Brave'),
('Phantom'), ('Radiant'), ('Shiny'), ('Legendary'), ('Cosmic'),
('Shadow'), ('Crystal'), ('Golden'), ('Sapphire'), ('Crimson'),
('Electric'), ('Psychic'), ('Spectral'), ('Iron'), ('Stormy'),
('Ancient'), ('Primal'), ('Mega'), ('Ultra'), ('Galactic');
