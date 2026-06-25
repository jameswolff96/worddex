import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Brandbar } from "@/components/Brandbar";
import { JoinByCodeClient } from "@/components/JoinByCodeClient";
import { OpenLobbiesClient } from "@/components/OpenLobbiesClient";
import type { LobbyRow, LobbyRules } from "@/lib/types/database";
import { pokemonSpriteUrl } from "@/lib/game/sprites";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("users")
        .select("display_name, discriminator, avatar")
        .eq("id", user.id)
        .single()
    : { data: null };

  const { data: openLobbies } = await supabase
    .from("lobbies")
    .select("id, code, mode, rules, status, created_at")
    .eq("visibility", "public")
    .eq("status", "waiting")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: myPlayerRows } = user
    ? await supabase
        .from("lobby_players")
        .select("lobbies(id, code, mode, status, rules, created_at)")
        .eq("user_id", user.id)
    : { data: null };

  const activeGames = (myPlayerRows ?? [])
    .map((r) => r.lobbies as unknown as LobbyRow | null)
    .filter((l): l is LobbyRow => l !== null && ["waiting", "playing"].includes(l.status))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
      <Brandbar />

      {/* ── Nav bar ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {user ? (
          <>
            <Link href="/lobby/create" className="pc-btn pc-btn-red">
              + New lobby
            </Link>
            <Link
              href="/profile"
              className="pc-btn pc-btn-ghost"
              style={{ fontSize: "0.85rem", padding: "6px 12px", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {pokemonSpriteUrl(profile?.avatar) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pokemonSpriteUrl(profile?.avatar)!}
                  alt=""
                  width={28}
                  height={28}
                  style={{ imageRendering: "pixelated", flexShrink: 0 }}
                />
              ) : (
                <div className="pokeball" style={{ width: 24, height: 24, flexShrink: 0 }} />
              )}
              <span>
                {profile?.display_name ?? "Profile"}
                {profile && <span style={{ color: "var(--pc-muted)", fontWeight: 400 }}>#{profile.discriminator}</span>}
              </span>
            </Link>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="pc-btn pc-btn-ghost"
                style={{ fontSize: "0.85rem", padding: "8px 14px" }}
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="pc-btn pc-btn-ghost"
              style={{ fontSize: "0.85rem", padding: "8px 14px" }}
            >
              Sign in
            </Link>
            <Link href="/lobby/create" className="pc-btn pc-btn-red">
              + Play as guest
            </Link>
          </>
        )}
      </div>

      {/* ── Active games ── */}
      {activeGames.length > 0 && (
        <div className="pc-card">
          <h2 className="pc-h2">Your active games</h2>
          <ul className="space-y-2">
            {activeGames.map((lobby) => {
              const rules = lobby.rules as LobbyRules;
              const modeLabel: Record<string, string> = {
                teams: "Teams",
                solo: "Solo / FFA",
                classroom_streamer: "Classroom",
              };
              const href = lobby.status === "playing"
                ? `/lobby/${lobby.code}/play`
                : `/lobby/${lobby.code}`;
              return (
                <li
                  key={lobby.id}
                  style={{
                    border: "2px solid var(--pc-ink)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    background: "var(--pc-input-bg)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <span className="font-bold" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
                      {lobby.code}
                    </span>
                    <span className="text-xs ml-2" style={{ color: "var(--pc-muted)" }}>
                      {modeLabel[lobby.mode] ?? lobby.mode}
                      {rules.number_of_rounds ? ` · ${rules.number_of_rounds}R` : ""}
                    </span>
                    <span
                      className="ml-2 text-xs font-bold"
                      style={{ color: lobby.status === "playing" ? "var(--pc-green)" : "var(--pc-yellow)" }}
                    >
                      {lobby.status === "playing" ? "● In progress" : "● Waiting"}
                    </span>
                  </div>
                  <Link
                    href={href}
                    className="pc-btn pc-btn-blue"
                    style={{ fontSize: "0.85rem", padding: "6px 14px" }}
                  >
                    Rejoin
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Join by code ── */}
      <div className="pc-card">
        <h2 className="pc-h2">Join a private lobby</h2>
        <JoinByCodeClient />
      </div>

      {/* ── Public lobbies ── */}
      <div className="pc-card">
        <h2 className="pc-h2">Open lobbies</h2>
        <OpenLobbiesClient initialLobbies={(openLobbies ?? []) as LobbyRow[]} />
      </div>

      <footer
        className="text-center text-xs mt-6"
        style={{ color: "var(--pc-muted)" }}
      >
        WordDex &middot; Not affiliated with Nintendo / Game Freak
      </footer>
    </div>
  );
}

