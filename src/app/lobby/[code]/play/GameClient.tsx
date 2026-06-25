"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  submitClue,
  submitGuess,
  rerollTerm,
  skipTerm,
  forcedSkip,
  endTurn,
  advanceTurn,
  nextTerm,
} from "@/lib/game/engine";
import { endGame, abandonGame } from "@/app/lobby/actions";
import type {
  LobbyRules,
  SlotCell,
  CurrentTerm,
  GamePhase,
} from "@/lib/types/database";
import { Brandbar } from "@/components/Brandbar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { pokemonSpriteUrl } from "@/lib/game/sprites";

// ── Re-export the types so play/page.tsx can share them ──

// ── Types ──────────────────────────────────────────────────

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
  clue_master_rotation_index: number;
}

interface Lobby {
  id: string;
  code: string;
  mode: "teams" | "solo" | "classroom_streamer";
  rules: LobbyRules;
  status: string;
  host_user_id: string;
  lobby_players: Player[];
  lobby_teams: Team[];
}

interface GameState {
  lobby_id: string;
  current_round: number;
  current_turn_player_id: string | null;
  current_team_id: string | null;
  current_term: CurrentTerm | null;
  slot_grid: SlotCell[];
  used_words_this_turn: string[];
  terms_completed_this_turn: number;
  phase: GamePhase;
}

interface ChatMessage {
  id: string;
  content: string;
  kind: "clue" | "guess" | "system";
  metadata: Record<string, unknown>;
  created_at: string;
  sender_player_id: string | null;
  lobby_players?: {
    guest_name: string | null;
    users?: { display_name: string; discriminator: number } | null;
  } | null;
}

interface Props {
  lobby: Lobby;
  initialGameState: GameState | null;
  initialChat: ChatMessage[];
  currentUserId: string | null;
  myPlayerId: string | null;
  wordBank: { term: string; category: string; sprite_ref: string | null }[];
}

// ── Helpers ────────────────────────────────────────────────

function playerDisplayName(
  p: { users?: { display_name: string; discriminator: number } | null; guest_name?: string | null },
  collidingNames: Set<string>
): string {
  if (!p.users) return p.guest_name ?? "Unknown";
  const { display_name, discriminator } = p.users;
  return collidingNames.has(display_name) ? `${display_name}#${discriminator}` : display_name;
}

// ── Main Component ─────────────────────────────────────────

export function GameClient({
  lobby,
  initialGameState,
  initialChat,
  currentUserId,
  myPlayerId,
  wordBank,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [gs, setGs] = useState<GameState | null>(initialGameState);
  const [chat, setChat] = useState<ChatMessage[]>(initialChat);
  const [players, setPlayers] = useState(lobby.lobby_players);
  const [teams, setTeams] = useState(lobby.lobby_teams);
  const [clueInput, setClueInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const countdownTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const rules = lobby.rules;
  const mode = lobby.mode;
  const isHost = currentUserId === lobby.host_user_id;

  // Am I the current clue master?
  const isClueMaster =
    gs?.current_turn_player_id === myPlayerId ||
    (mode === "classroom_streamer" &&
      lobby.lobby_players.find(
        (p) => p.id === lobby.id // TODO: compare classroom_clue_giver_player_id
      ) != null);

  const currentTerm = gs?.current_term as CurrentTerm | null;
  const slots = (gs?.slot_grid ?? []) as SlotCell[];
  const usedWords = new Set<string>(gs?.used_words_this_turn ?? []);
  const filledSlots = slots.filter((s) => s.kind !== "empty").length;
  const remainingBudget = slots.length - filledSlots;

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`game:${lobby.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_state",
          filter: `lobby_id=eq.${lobby.id}`,
        },
        (payload) => {
          setGs(payload.new as GameState);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `lobby_id=eq.${lobby.id}`,
        },
        (payload) => {
          setChat((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lobby_players", filter: `lobby_id=eq.${lobby.id}` },
        (payload) => {
          const updated = payload.new as Player;
          setPlayers((prev) => prev.map((p) => p.id === updated.id ? { ...p, score: updated.score } : p));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lobby_teams", filter: `lobby_id=eq.${lobby.id}` },
        (payload) => {
          const updated = payload.new as Team;
          setTeams((prev) => prev.map((t) => t.id === updated.id ? { ...t, score: updated.score } : t));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobby.id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // 10-second countdown after a correct guess
  useEffect(() => {
    if (gs?.phase !== "correct_guess") {
      setCountdown(null);
      countdownTimers.current.forEach(clearTimeout);
      countdownTimers.current = [];
      return;
    }

    setCountdown(10);

    const interval = setInterval(() => {
      setCountdown((c) => (c !== null && c > 1 ? c - 1 : null));
    }, 1000);

    const isActiveClueMaster = gs.current_turn_player_id === myPlayerId;
    if (isActiveClueMaster) {
      const t5 = setTimeout(async () => {
        await supabase.from("chat_messages").insert({
          lobby_id: lobby.id,
          kind: "system",
          content: "⏱ 5 seconds remaining…",
          metadata: {},
        });
      }, 5000);

      const t0 = setTimeout(async () => {
        const termsCompleted = gs.terms_completed_this_turn ?? 0;
        if (termsCompleted < rules.terms_per_turn) {
          await nextTerm(lobby.id);
        } else {
          await endTurn(lobby.id);
        }
      }, 10000);

      countdownTimers.current = [t5, t0];
    }

    return () => {
      clearInterval(interval);
      countdownTimers.current.forEach(clearTimeout);
      countdownTimers.current = [];
    };
  }, [gs?.phase, gs?.current_turn_player_id, myPlayerId, lobby.id]);

  // ── Word analysis for live counter ──
  const tokens = clueInput.trim().split(/\s+/).filter(Boolean);
  const newTokens = tokens.filter((t) => !usedWords.has(t.toLowerCase()));
  const freeTokens = tokens.filter((t) => usedWords.has(t.toLowerCase()));
  const inputCost = newTokens.length;
  const isReuse = tokens.length > 0 && newTokens.length === 0;

  // ── Actions ──

  function handleSendClue() {
    if (!clueInput.trim() || !myPlayerId) return;
    setError(null);
    startTransition(async () => {
      const result = await submitClue(lobby.id, myPlayerId, clueInput.trim());
      if ("error" in result) {
        setError(result.error);
      } else {
        setClueInput("");
      }
    });
  }

  function handleClickSlot(slot: SlotCell) {
    if (slot.kind !== "filled") return;
    setClueInput((prev) => (prev ? `${prev} ${slot.word}` : slot.word));
    // No focus — mobile keyboard should not open
  }

  function handleGuess(term: string) {
    if (!myPlayerId) return;
    setError(null);
    startTransition(async () => {
      const result = await submitGuess(lobby.id, myPlayerId, term);
      if ("error" in result) setError(result.error);
    });
  }

  function handleReroll() {
    setError(null);
    startTransition(async () => {
      const result = await rerollTerm(lobby.id);
      if (result?.error) setError(result.error);
    });
  }

  function handleSkip() {
    setError(null);
    startTransition(async () => {
      const result = await skipTerm(lobby.id);
      if (result?.error) setError(result.error);
    });
  }

  function handleForcedSkip() {
    if (!myPlayerId) return;
    setError(null);
    startTransition(async () => {
      const result = await forcedSkip(lobby.id, myPlayerId);
      if (result?.error) setError(result.error);
    });
  }

  function handleEndGame() {
    if (!confirm("End the game for everyone?")) return;
    setError(null);
    startTransition(async () => {
      const result = await endGame(lobby.id);
      if (result?.error) setError(result.error);
    });
  }

  function handleAbandon() {
    if (!myPlayerId) return;
    if (!confirm("Leave this game? You won't be able to rejoin.")) return;
    startTransition(async () => {
      await abandonGame(lobby.id, myPlayerId);
      router.push("/");
    });
  }

  // Compute which display names appear more than once so we only show
  // the discriminator when it's actually needed to tell players apart.
  const nameCount = new Map<string, number>();
  for (const p of players) {
    if (p.users?.display_name) {
      nameCount.set(p.users.display_name, (nameCount.get(p.users.display_name) ?? 0) + 1);
    }
  }
  const collidingNames = new Set(
    [...nameCount.entries()].filter(([, n]) => n > 1).map(([name]) => name)
  );

  // ── Scores (use live state so they update without refresh) ──
  const scores =
    mode === "solo"
      ? [...players]
          .sort((a, b) => a.join_order - b.join_order)
          .map((p) => ({
            id: p.id,
            name: playerDisplayName(p, collidingNames),
            score: p.score,
            active: gs?.current_turn_player_id === p.id,
            avatar: p.users?.avatar ?? null,
          }))
      : [...teams]
          .sort((a, b) => a.turn_order - b.turn_order)
          .map((t) => ({
            id: t.id,
            name: t.name,
            score: t.score,
            active: gs?.current_team_id === t.id,
          }));

  // Resolve chat sender from live players state — Realtime payloads don't include joins
  function senderName(msg: ChatMessage): string {
    if (!msg.sender_player_id) return "System";
    const p = players.find((pl) => pl.id === msg.sender_player_id);
    if (!p) return "Unknown";
    return playerDisplayName(p, collidingNames);
  }

  const [guessInput, setGuessInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const suggestions = useMemo(() => {
    if (!guessInput.trim()) return [];
    const q = guessInput.toLowerCase();
    return wordBank.filter((t) => t.term.toLowerCase().includes(q)).slice(0, 8);
  }, [guessInput, wordBank]);

  const termSpriteMap = useMemo(
    () => new Map(wordBank.map((t) => [t.term, t.sprite_ref])),
    [wordBank]
  );

  // ── Render ──

  if (!gs || gs.phase === "waiting") {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <Brandbar />
        <div className="pc-card text-center">
          <p style={{ color: "var(--pc-muted)" }}>Waiting for the game to start…</p>
        </div>
      </div>
    );
  }

  if (gs.phase === "turn_end") {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <Brandbar />
        <div className="pc-card text-center">
          <h2 className="pc-h2" style={{ textAlign: "center" }}>Turn complete!</h2>
          <ul className="mt-3 mb-5 space-y-2">
            {[...scores]
              .sort((a, b) => b.score - a.score)
              .map((s) => (
                <li key={s.id} className="flex justify-between px-3 py-2 rounded-lg"
                  style={{ border: "2px solid var(--pc-ink)", background: "var(--pc-input-bg)" }}>
                  <span className="font-bold">{s.name}</span>
                  <span style={{ color: "var(--pc-blue)" }}>{s.score} pts</span>
                </li>
              ))}
          </ul>
          {error && <p className="text-sm font-bold mb-3" style={{ color: "var(--pc-red)" }}>{error}</p>}
          {isHost ? (
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                disabled={isPending}
                className="pc-btn pc-btn-red"
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await advanceTurn(lobby.id);
                    if (result?.error) setError(result.error);
                  });
                }}
              >
                {isPending ? "Starting…" : "Next turn →"}
              </button>
              <button disabled={isPending} className="pc-btn pc-btn-ghost" onClick={handleEndGame}>
                End game
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p style={{ color: "var(--pc-muted)" }}>Waiting for the host to start the next turn…</p>
              <button disabled={isPending} className="pc-btn pc-btn-ghost" onClick={handleAbandon}>
                Leave game
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gs.phase === "game_over") {
    const winner = [...scores].sort((a, b) => b.score - a.score)[0];
    return (
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <Brandbar />
        <div className="pc-card text-center">
          <div className="pokeball" style={{ width: 64, height: 64, margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "1.6rem", color: "var(--pc-red)", fontFamily: "'Trebuchet MS',Verdana,sans-serif" }}>
            {winner?.name} wins!
          </h2>
          <ul className="mt-4 space-y-2">
            {[...scores]
              .sort((a, b) => b.score - a.score)
              .map((s, i) => (
                <li key={s.id} className="flex justify-between px-3 py-2 rounded-lg"
                  style={{ border: "2px solid var(--pc-ink)", background: "var(--pc-input-bg)" }}>
                  <span className="font-bold">{i === 0 ? "🏆 " : ""}{s.name}</span>
                  <span style={{ color: "var(--pc-blue)" }}>{s.score} pts</span>
                </li>
              ))}
          </ul>
          <button
            className="pc-btn pc-btn-red mt-5"
            onClick={() => router.push("/")}
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        maxWidth: 900,
        margin: "0 auto",
        padding: "0 8px",
      }}
    >
      {/* ── Top bar: scores ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          padding: "10px 0 6px",
          flexShrink: 0,
        }}
      >
        {scores.map((s) => {
          const spriteUrl = "avatar" in s ? pokemonSpriteUrl(s.avatar as string | null) : null;
          return (
            <div
              key={s.id}
              className={`pc-scorechip${s.active ? " pc-scorechip-active" : ""}`}
            >
              {spriteUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={spriteUrl}
                  alt=""
                  width={32}
                  height={32}
                  style={{ imageRendering: "pixelated", display: "block", margin: "0 auto -4px" }}
                />
              )}
              <span style={{ fontSize: "0.75rem" }}>{s.name}</span>
              <span
                className="block"
                style={{ fontSize: "1rem", color: "var(--pc-blue)" }}
              >
                {s.score}
              </span>
            </div>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--pc-muted)", whiteSpace: "nowrap" }}>
            Round {gs.current_round} / {rules.number_of_rounds}
          </span>
          {isHost ? (
            <button
              disabled={isPending}
              className="pc-btn pc-btn-ghost"
              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
              onClick={handleEndGame}
            >
              End game
            </button>
          ) : (
            <button
              disabled={isPending}
              className="pc-btn pc-btn-ghost"
              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
              onClick={handleAbandon}
            >
              Leave
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* ── Main area (slot grid + clue master controls) ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "8px 0",
        }}
      >
        {/* Slot grid */}
        <div className="pc-card" style={{ marginBottom: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
              gap: 6,
            }}
          >
            {slots.map((slot, i) => (
              <div
                key={i}
                className={`pc-slot${slot.kind === "filled" ? " pc-slot-filled" : ""}${slot.kind === "reroll" ? " pc-slot-reroll" : ""}`}
                style={{
                  cursor:
                    slot.kind === "filled" && isClueMaster ? "pointer" : "default",
                  fontSize: "0.78rem",
                }}
                onClick={() => isClueMaster && handleClickSlot(slot)}
                title={
                  slot.kind === "filled" && isClueMaster
                    ? "Click to append this word to your clue"
                    : undefined
                }
              >
                {slot.kind === "filled"
                  ? slot.word
                  : slot.kind === "reroll"
                  ? "—"
                  : ""}
              </div>
            ))}
          </div>

          {/* Clue master: secret term + controls */}
          {isClueMaster && currentTerm && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 10,
                border: "2px solid var(--pc-ink)",
                background: "var(--pc-input-bg)",
              }}
            >
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: "var(--pc-muted)" }}
              >
                Your secret term · {currentTerm.category}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {pokemonSpriteUrl(currentTerm.sprite_ref) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pokemonSpriteUrl(currentTerm.sprite_ref)!}
                    alt={currentTerm.term}
                    width={72}
                    height={72}
                    style={{ imageRendering: "pixelated", flexShrink: 0 }}
                  />
                )}
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    fontFamily: "'Trebuchet MS',Verdana,sans-serif",
                    color: "var(--pc-red)",
                  }}
                >
                  {currentTerm.term}
                </div>
              </div>
              <div
                className="flex gap-2 mt-3 flex-wrap"
                style={{ fontSize: "0.85rem" }}
              >
                {mode !== "teams" ? (
                  <>
                    {remainingBudget > 0 ? (
                      <button
                        onClick={handleReroll}
                        disabled={isPending}
                        className="pc-btn pc-btn-ghost"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      >
                        Reroll (costs 1 slot)
                      </button>
                    ) : (
                      <button
                        onClick={handleForcedSkip}
                        disabled={isPending}
                        className="pc-btn pc-btn-red"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      >
                        Forced skip (−1 pt)
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={handleSkip}
                    disabled={isPending}
                    className="pc-btn pc-btn-ghost"
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  >
                    Skip (free)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Correct-guess countdown banner */}
        {countdown !== null && (
          <div
            style={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: "1rem",
              padding: "10px",
              borderRadius: 10,
              border: "2px solid var(--pc-ink)",
              background: "var(--pc-input-bg)",
              color: countdown <= 3 ? "var(--pc-red)" : "var(--pc-yellow)",
            }}
          >
            Turn ends in {countdown}s
          </div>
        )}

        {/* Budget display for non-clue-masters */}
        {!isClueMaster && countdown === null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 10,
              border: "2px solid var(--pc-ink)",
              background: "var(--pc-input-bg)",
              fontSize: "0.85rem",
              color: "var(--pc-muted)",
            }}
          >
            <span style={{ fontWeight: 700, color: "var(--pc-red)", fontSize: "1.2rem" }}>
              {remainingBudget}
            </span>
            <span>slots remaining</span>
          </div>
        )}
      </div>

      {/* ── Chat area ── */}
      <div
        style={{
          height: 260,
          display: "flex",
          flexDirection: "column",
          borderTop: "3px solid var(--pc-ink)",
          flexShrink: 0,
        }}
      >
        {/* Chat messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {chat.map((msg) => {
            const guessTerm = (msg.metadata as { term?: string }).term;
            const spriteUrl = guessTerm
              ? pokemonSpriteUrl(termSpriteMap.get(guessTerm) ?? null)
              : null;
            return <ChatLine key={msg.id} msg={msg} sender={senderName(msg)} spriteUrl={spriteUrl} />;
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            borderTop: "2px solid var(--pc-ink)",
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {error && (
            <p className="text-xs font-bold" style={{ color: "var(--pc-red)" }}>
              {error}
            </p>
          )}

          {countdown !== null ? (
            <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--pc-muted)" }}>
              Waiting for the turn to end…
            </p>
          ) : isClueMaster ? (
            <>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  id="clue-input"
                  value={clueInput}
                  onChange={(e) => setClueInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendClue();
                    }
                  }}
                  placeholder="Type clue and press Enter…"
                  className="pc-input"
                  style={{ flex: 1, marginBottom: 0 }}
                  disabled={isPending}
                />
                <button
                  onClick={handleSendClue}
                  disabled={isPending || !clueInput.trim()}
                  className="pc-btn pc-btn-blue"
                  style={{ flexShrink: 0, padding: "8px 14px" }}
                >
                  Send
                </button>
              </div>
              {clueInput.trim() && (
                <p style={{ fontSize: "0.72rem", color: isReuse ? "var(--pc-green)" : "var(--pc-muted)" }}>
                  {isReuse
                    ? "♻ All words free (already used)"
                    : `${inputCost} new word${inputCost !== 1 ? "s" : ""} · ${freeTokens.length} free`}
                </p>
              )}
            </>
          ) : (
            <div style={{ position: "relative" }}>
              {showSuggestions && suggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "var(--pc-card)",
                    border: "3px solid var(--pc-ink)",
                    borderRadius: 10,
                    boxShadow: "var(--pc-shadow)",
                    zIndex: 20,
                    maxHeight: 220,
                    overflowY: "auto",
                  }}
                >
                  {suggestions.map((t, i) => (
                    <button
                      key={t.term}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleGuess(t.term);
                        setGuessInput("");
                        setShowSuggestions(false);
                        setSelectedIdx(-1);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "8px 12px",
                        background: i === selectedIdx ? "var(--pc-input-bg)" : "transparent",
                        border: "none",
                        borderBottom: i < suggestions.length - 1 ? "1px solid var(--pc-ink)" : "none",
                        cursor: "pointer",
                        textAlign: "left",
                        color: "var(--pc-text)",
                        fontFamily: "inherit",
                        fontSize: "0.85rem",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {pokemonSpriteUrl(t.sprite_ref) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={pokemonSpriteUrl(t.sprite_ref)!}
                            alt=""
                            width={24}
                            height={24}
                            style={{ imageRendering: "pixelated", flexShrink: 0 }}
                          />
                        )}
                        <span style={{ fontWeight: 700 }}>{t.term}</span>
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--pc-muted)" }}>{t.category}</span>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={guessInput}
                  onChange={(e) => {
                    setGuessInput(e.target.value);
                    setShowSuggestions(true);
                    setSelectedIdx(-1);
                  }}
                  onKeyDown={(e) => {
                    if (showSuggestions && suggestions.length > 0) {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSelectedIdx((i) => Math.min(i + 1, suggestions.length - 1));
                        return;
                      }
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSelectedIdx((i) => Math.max(i - 1, -1));
                        return;
                      }
                      if (e.key === "Escape") {
                        setShowSuggestions(false);
                        setSelectedIdx(-1);
                        return;
                      }
                    }
                    if (e.key === "Enter") {
                      const term =
                        selectedIdx >= 0
                          ? suggestions[selectedIdx]?.term
                          : guessInput.trim();
                      if (term) {
                        handleGuess(term);
                        setGuessInput("");
                        setShowSuggestions(false);
                        setSelectedIdx(-1);
                      }
                    }
                  }}
                  onFocus={() => {
                    if (guessInput.trim()) setShowSuggestions(true);
                  }}
                  onBlur={() => setShowSuggestions(false)}
                  placeholder="Type your guess…"
                  className="pc-input"
                  style={{ flex: 1, marginBottom: 0 }}
                  disabled={isPending || !currentTerm?.current_clue_message_id}
                />
                <button
                  onClick={() => {
                    const term =
                      selectedIdx >= 0
                        ? suggestions[selectedIdx]?.term
                        : guessInput.trim();
                    if (term) {
                      handleGuess(term);
                      setGuessInput("");
                      setShowSuggestions(false);
                      setSelectedIdx(-1);
                    }
                  }}
                  disabled={
                    isPending ||
                    !guessInput.trim() ||
                    !currentTerm?.current_clue_message_id
                  }
                  className="pc-btn pc-btn-green"
                  style={{ flexShrink: 0, padding: "8px 14px" }}
                >
                  Guess
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Chat line renderer ─────────────────────────────────────

function ChatLine({ msg, sender, spriteUrl }: { msg: ChatMessage; sender: string | null; spriteUrl?: string | null }) {

  const meta = msg.metadata as {
    correct?: boolean;
    term?: string;
  };

  if (msg.kind === "system") {
    return (
      <div style={{ fontSize: "0.72rem", color: "var(--pc-muted)", textAlign: "center", padding: "2px 0" }}>
        {msg.content}
      </div>
    );
  }

  if (msg.kind === "clue") {
    return (
      <div style={{ fontSize: "0.85rem" }}>
        <span style={{ fontWeight: 700, color: "var(--pc-blue)" }}>
          {sender} (Clue):
        </span>{" "}
        {msg.content}
      </div>
    );
  }

  // guess
  return (
    <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      <span style={{ fontWeight: 700 }}>{sender}:</span>
      <span style={{ color: meta.correct ? "var(--pc-green)" : "var(--pc-red-dark)", fontWeight: 700 }}>
        {meta.correct ? "✓" : "✗"}
      </span>
      {spriteUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={spriteUrl} alt="" width={20} height={20} style={{ imageRendering: "pixelated" }} />
      )}
      {msg.content}
    </div>
  );
}
