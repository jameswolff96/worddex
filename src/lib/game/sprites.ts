const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function pokemonSpriteUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  const n = parseInt(avatar, 10);
  if (isNaN(n) || n < 1) return null;
  return `${SPRITE_BASE}/${n}.png`;
}
