import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Brandbar } from "@/components/Brandbar";
import { LobbyRoom } from "./LobbyRoom";
import type { LobbyRules } from "@/lib/types/database";

interface Props {
  params: Promise<{ code: string }>;
}

// Minimal shape needed from DB query
interface LobbyData {
  id: string;
  code: string;
  mode: "teams" | "solo" | "classroom_streamer";
  visibility: "public" | "private";
  status: "waiting" | "playing" | "finished";
  rules: LobbyRules;
  host_user_id: string;
  lobby_players: Array<{
    id: string;
    user_id: string | null;
    guest_name: string | null;
    team_id: string | null;
    connection_status: "connected" | "disconnected";
    join_order: number;
    score: number;
    users: { id: string; display_name: string; discriminator: number; avatar: string | null } | null;
  }>;
  lobby_teams: Array<{
    id: string;
    name: string;
    score: number;
    turn_order: number;
  }>;
}

export default async function LobbyPage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rawLobby } = await supabase
    .from("lobbies")
    .select(
      "id, code, mode, visibility, status, rules, host_user_id, lobby_players(id, user_id, guest_name, team_id, connection_status, join_order, score, users(id, display_name, discriminator, avatar)), lobby_teams(id, name, score, turn_order)"
    )
    .eq("code", code.toUpperCase())
    .single();

  if (!rawLobby) notFound();

  const lobby = rawLobby as unknown as LobbyData;

  if (lobby.status === "playing") {
    redirect(`/lobby/${code}/play`);
  }

  const rules = lobby.rules;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
      <Brandbar />

      <div className="pc-card">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <h2 className="pc-h2" style={{ marginBottom: 2 }}>
              Lobby{" "}
              <span
                style={{
                  fontFamily: "monospace",
                  letterSpacing: "0.1em",
                  color: "var(--pc-red)",
                }}
              >
                {lobby.code}
              </span>
            </h2>
            <p className="text-xs" style={{ color: "var(--pc-muted)" }}>
              {rules.number_of_rounds}R · {rules.terms_per_turn} terms ·{" "}
              {rules.word_budget} words ·{" "}
              {{ teams: "Teams", solo: "Free-for-all", classroom_streamer: "Classroom" }[lobby.mode] ?? lobby.mode}
            </p>
          </div>
          <div
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ border: "2px solid var(--pc-ink)", background: "var(--pc-input-bg)" }}
          >
            {lobby.visibility === "private" ? "🔒 Private" : "🌍 Public"}
          </div>
        </div>

        <div
          className="mb-3 p-3 rounded-lg text-sm"
          style={{ background: "var(--pc-input-bg)", border: "2px solid var(--pc-ink)" }}
        >
          Share code:{" "}
          <span
            className="font-bold tracking-widest"
            style={{ color: "var(--pc-red)", fontFamily: "monospace" }}
          >
            {lobby.code}
          </span>
        </div>
      </div>

      <LobbyRoom
        lobby={lobby}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}
