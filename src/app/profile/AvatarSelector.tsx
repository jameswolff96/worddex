"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { POKEMON_LIST } from "@/lib/game/pokemonList";
import { pokemonSpriteUrl } from "@/lib/game/sprites";
import { updateAvatar } from "./actions";

export function AvatarSelector({ currentAvatar }: { currentAvatar: string | null }) {
  const router = useRouter();
  const [avatar, setAvatar] = useState(currentAvatar);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return POKEMON_LIST;
    return POKEMON_LIST.filter(
      (p) => p.name.toLowerCase().includes(q) || String(p.id).startsWith(q)
    );
  }, [search]);

  function handleSelect(id: number) {
    const idStr = String(id);
    const prev = avatar;
    setAvatar(idStr);
    setError(null);
    startTransition(async () => {
      const result = await updateAvatar(idStr);
      if (result?.error) {
        setAvatar(prev);
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="pc-card">
      <h2 className="pc-h2">Choose your Pokémon</h2>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or Dex #…"
        className="pc-input"
      />
      {error && (
        <p className="text-sm font-bold mt-1" style={{ color: "var(--pc-red)" }}>
          {error}
        </p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))",
          gap: 4,
          maxHeight: 340,
          overflowY: "auto",
          marginTop: 8,
          padding: 4,
        }}
      >
        {filtered.map((p) => {
          const selected = avatar === String(p.id);
          return (
            <button
              key={p.id}
              type="button"
              title={`#${p.id} ${p.name}`}
              onClick={() => handleSelect(p.id)}
              disabled={isPending}
              style={{
                padding: 2,
                borderRadius: 6,
                border: selected
                  ? "2px solid var(--pc-red)"
                  : "2px solid transparent",
                background: selected ? "var(--pc-input-bg)" : "transparent",
                cursor: isPending ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pokemonSpriteUrl(String(p.id))!}
                alt={p.name}
                width={48}
                height={48}
                loading="lazy"
                style={{ imageRendering: "pixelated", display: "block" }}
                onError={(e) => {
                  (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                }}
              />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p
            className="col-span-full text-sm"
            style={{ color: "var(--pc-muted)", textAlign: "center", padding: "12px 0" }}
          >
            No Pokémon found
          </p>
        )}
      </div>
      {isPending && (
        <p className="text-xs mt-2" style={{ color: "var(--pc-muted)", textAlign: "center" }}>
          Saving…
        </p>
      )}
    </div>
  );
}
