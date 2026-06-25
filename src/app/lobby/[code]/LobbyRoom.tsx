"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { createClient } from "@/lib/supabase/client";
import { joinLobby, startGame, kickPlayer } from "../actions";
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
  const captchaRef = useRef<HCaptcha>(null);
  const isGuest = !currentUserId;

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
            .select("id, user_id, guest_name, team_id, connection_status, join_order, score, users(id, display_name, discriminator, avatar)")
            .eq("lobby_id", initialLobby.id)
            .order("join_order")
            .then(({ data }) => {
              if (!data) return;
              setPlayers(data as unknown as Player[]);
              // Detect if the current user was kicked
              if (currentUserId) {
                const stillInLobby = data.some((p) => p.user_id === currentUserId);
                if (!stillInLobby) router.push("/");
              }
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

  async function doJoin() {
    startTransition(async () => {
      const result = await joinLobby(initialLobby.id);
      if (result?.error) setError(result.error);
      else setJoined(true);
    });
  }

  function handleJoin() {
    if (isGuest) {
      // Guest: execute captcha first; doJoin is called from onCaptchaVerify
      captchaRef.current?.execute();
    } else {
      doJoin();
    }
  }

  async function onCaptchaVerify(token: string) {
    const supabase = createClient();
    const { error: anonError } = await supabase.auth.signInAnonymously({
      options: { captchaToken: token },
    });
    if (anonError) {
      setError("Failed to create guest session");
      return;
    }
    doJoin();
  }

  async function handleStartGame() {
    const result = await startGame(initialLobby.id);
    if (result?.error) setError(result.error);
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
                  <div className="flex items-center gap-2">
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
                    {isHost && p.user_id !== initialLobby.host_user_id && (
                      <button
                        onClick={() => {
                          startTransition(async () => {
                            const result = await kickPlayer(initialLobby.id, p.id);
                            if (result?.error) setError(result.error);
                          });
                        }}
                        disabled={isPending}
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{
                          border: "1.5px solid var(--pc-red)",
                          color: "var(--pc-red)",
                          background: "transparent",
                          cursor: "pointer",
                          lineHeight: 1.4,
                        }}
                      >
                        Kick
                      </button>
                    )}
                  </div>
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

      {isGuest && (
        <HCaptcha
          ref={captchaRef}
          sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
          size="invisible"
          onVerify={onCaptchaVerify}
          onError={() => setError("Captcha failed — please try again")}
        />
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
