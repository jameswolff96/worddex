"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { joinLobby } from "../actions";
import type { LobbyRules } from "@/lib/types/database";

interface Player {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  team_id: string | null;
  connection_status: string;
  join_order: number;
  score: number;
  users?: {
    id: string;
    display_name: string;
    discriminator: number;
    avatar: string | null;
  } | null;
}

interface Team {
  id: string;
  name: string;
  score: number;
  turn_order: number;
}

interface Lobby {
  id: string;
  code: string;
  mode: string;
  visibility: string;
  status: string;
  rules: LobbyRules;
  host_user_id: string;
  lobby_players: Player[];
  lobby_teams: Team[];
}

interface Props {
  lobby: Lobby;
  currentUserId: string | null;
}

export function LobbyRoom({ lobby: initialLobby, currentUserId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [players, setPlayers] = useState<Player[]>(initialLobby.lobby_players);
  const [joined, setJoined] = useState(
    currentUserId
      ? initialLobby.lobby_players.some((p) => p.user_id === currentUserId)
      : false
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isHost = currentUserId === initialLobby.host_user_id;

  useEffect(() => {
    const channel = supabase
      .channel(`lobby:${initialLobby.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lobby_players",
          filter: `lobby_id=eq.${initialLobby.id}`,
        },
        () => {
          supabase
            .from("lobby_players")
            .select("id, user_id, guest_name, team_id, connection_status, join_order, score")
            .eq("lobby_id", initialLobby.id)
            .order("join_order")
            .then(({ data }) => {
              if (data) setPlayers(data as unknown as Player[]);
            });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lobbies",
          filter: `id=eq.${initialLobby.id}`,
        },
        (payload) => {
          if ((payload.new as { status: string }).status === "playing") {
            router.push(`/lobby/${initialLobby.code}/play`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialLobby.id, initialLobby.code]);

  function handleJoin() {
    startTransition(async () => {
      const result = await joinLobby(initialLobby.id, !currentUserId);
      if (result?.error) {
        setError(result.error);
      } else {
        setJoined(true);
      }
    });
  }

  async function handleStartGame() {
    const { error: err } = await supabase
      .from("lobbies")
      .update({ status: "playing" })
      .eq("id", initialLobby.id);
    if (err) setError(err.message);
  }

  const displayName = (p: Player) =>
    p.users?.display_name ?? p.guest_name ?? "Unknown";

  return (
    <div>
      <div className="pc-card">
        <h2 className="pc-h2">Players ({players.length})</h2>
        {players.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--pc-muted)" }}>
            No players yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {[...players]
              .sort((a, b) => a.join_order - b.join_order)
              .map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold"
                  style={{
                    border: "2px solid var(--pc-ink)",
                    background: "var(--pc-input-bg)",
                  }}
                >
                  <span>
                    {displayName(p)}
                    {p.users?.discriminator != null && (
                      <span className="font-normal ml-1 text-xs" style={{ color: "var(--pc-muted)" }}>
                        #{p.users.discriminator}
                      </span>
                    )}
                    {p.user_id === initialLobby.host_user_id && (
                      <span className="ml-2 text-xs" style={{ color: "var(--pc-yellow)" }}>
                        HOST
                      </span>
                    )}
                    {!p.user_id && (
                      <span className="ml-2 text-xs" style={{ color: "var(--pc-muted)" }}>
                        guest
                      </span>
                    )}
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color:
                        p.connection_status === "connected"
                          ? "var(--pc-green)"
                          : "var(--pc-muted)",
                    }}
                  >
                    {p.connection_status === "connected" ? "● online" : "○ away"}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="text-sm font-bold mb-4" style={{ color: "var(--pc-red)" }}>
          {error}
        </p>
      )}

      {!joined && (
        <button
          onClick={handleJoin}
          disabled={isPending}
          className="pc-btn pc-btn-blue pc-btn-block"
        >
          {isPending ? "Joining…" : "Join lobby"}
        </button>
      )}

      {joined && isHost && (
        <button
          onClick={handleStartGame}
          disabled={players.length < 2}
          className="pc-btn pc-btn-red pc-btn-block"
          style={{ fontSize: "1.05rem" }}
        >
          {players.length < 2 ? "Need at least 2 players to start" : "Start game →"}
        </button>
      )}

      {joined && !isHost && (
        <p className="text-center text-sm" style={{ color: "var(--pc-muted)" }}>
          Waiting for the host to start the game…
        </p>
      )}
    </div>
  );
}
