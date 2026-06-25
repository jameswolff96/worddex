import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Brandbar } from "@/components/Brandbar";
import { JoinByCodeClient } from "@/components/JoinByCodeClient";
import type { LobbyRow, LobbyRules } from "@/lib/types/database";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: openLobbies } = await supabase
    .from("lobbies")
    .select("id, code, mode, rules, status, created_at")
    .eq("visibility", "public")
    .eq("status", "waiting")
    .order("created_at", { ascending: false })
    .limit(20);

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
              style={{ fontSize: "0.85rem", padding: "8px 14px" }}
            >
              Profile
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
            <Link
              href="/auth/signup"
              className="pc-btn pc-btn-blue"
              style={{ fontSize: "0.85rem", padding: "8px 14px" }}
            >
              Create account
            </Link>
            <Link href="/lobby/create" className="pc-btn pc-btn-red">
              + Play as guest
            </Link>
          </>
        )}
      </div>

      {/* ── Join by code ── */}
      <div className="pc-card">
        <h2 className="pc-h2">Join a private lobby</h2>
        <JoinByCodeClient />
      </div>

      {/* ── Public lobbies ── */}
      <div className="pc-card">
        <h2 className="pc-h2">Open lobbies</h2>
        {openLobbies && openLobbies.length > 0 ? (
          <ul className="space-y-2">
            {(openLobbies as LobbyRow[]).map((lobby) => (
              <PublicLobbyRow key={lobby.id} lobby={lobby} />
            ))}
          </ul>
        ) : (
          <p className="text-sm" style={{ color: "var(--pc-muted)" }}>
            No open lobbies right now.{" "}
            <Link
              href="/lobby/create"
              style={{ color: "var(--pc-blue)", fontWeight: 700 }}
            >
              Start one!
            </Link>
          </p>
        )}
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

function PublicLobbyRow({ lobby }: { lobby: LobbyRow }) {
  const rules = lobby.rules as LobbyRules;
  const modeLabel: Record<string, string> = {
    teams: "Teams",
    solo: "Solo / FFA",
    classroom_streamer: "Classroom",
  };

  return (
    <li
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
        <span
          className="font-bold"
          style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}
        >
          {lobby.code}
        </span>
        <span className="text-xs ml-2" style={{ color: "var(--pc-muted)" }}>
          {modeLabel[lobby.mode] ?? lobby.mode}
          {rules.number_of_rounds ? ` · ${rules.number_of_rounds}R` : ""}
          {rules.terms_per_turn ? ` · ${rules.terms_per_turn} terms` : ""}
        </span>
      </div>
      <Link
        href={`/lobby/${lobby.code}`}
        className="pc-btn pc-btn-green"
        style={{ fontSize: "0.85rem", padding: "6px 14px" }}
      >
        Join
      </Link>
    </li>
  );
}
