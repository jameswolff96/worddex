"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  submitClue,
  submitGuess,
  rerollTerm,
  skipTerm,
  forcedSkip,
  endTurn,
  startTurn,
  advanceTurn,
} from "@/lib/game/engine";
import type {
  LobbyRules,
  SlotCell,
  CurrentTerm,
  GamePhase,
} from "@/lib/types/database";
import { Brandbar } from "@/components/Brandbar";

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
}

// ── Helpers ────────────────────────────────────────────────

function playerDisplayName(p: {
  users?: { display_name: string; discriminator: number } | null;
  guest_name?: string | null;
}): string {
  return p.users?.display_name ?? p.guest_name ?? "Unknown";
}

function chatSenderName(msg: ChatMessage): string {
  if (!msg.lobby_players) return "System";
  return (
    msg.lobby_players.users?.display_name ??
    msg.lobby_players.guest_name ??
    "Unknown"
  );
}

// ── Main Component ─────────────────────────────────────────

export function GameClient({
  lobby,
  initialGameState,
  initialChat,
  currentUserId,
  myPlayerId,
}: Props) {
  const supabase = createClient();
  const [gs, setGs] = useState<GameState | null>(initialGameState);
  const [chat, setChat] = useState<ChatMessage[]>(initialChat);
  const [clueInput, setClueInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const rules = lobby.rules;
  const mode = lobby.mode;
  const myPlayer = lobby.lobby_players.find((p) => p.id === myPlayerId) ?? null;

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobby.id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

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

  function handleEndTurn() {
    setError(null);
    startTransition(async () => {
      const result = await endTurn(lobby.id);
      if (result?.error) setError(result.error);
    });
  }

  // ── Scores ──
  const scores =
    mode === "solo"
      ? [...lobby.lobby_players]
          .sort((a, b) => a.join_order - b.join_order)
          .map((p) => ({
            id: p.id,
            name: playerDisplayName(p),
            score: p.score,
            active: gs?.current_turn_player_id === p.id,
          }))
      : [...lobby.lobby_teams]
          .sort((a, b) => a.turn_order - b.turn_order)
          .map((t) => ({
            id: t.id,
            name: t.name,
            score: t.score,
            active: gs?.current_team_id === t.id,
          }));

  // ── Guess options: all word bank terms visible to guessers ──
  // For now use a simple text input; a dropdown from server would need API call
  const [guessInput, setGuessInput] = useState("");

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
    const isHost = currentUserId === lobby.host_user_id;
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
          ) : (
            <p style={{ color: "var(--pc-muted)" }}>Waiting for the host to start the next turn…</p>
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
        {scores.map((s) => (
          <div
            key={s.id}
            className={`pc-scorechip${s.active ? " pc-scorechip-active" : ""}`}
          >
            <span style={{ fontSize: "0.75rem" }}>{s.name}</span>
            <span
              className="block"
              style={{ fontSize: "1rem", color: "var(--pc-blue)" }}
            >
              {s.score}
            </span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--pc-muted)", alignSelf: "center", whiteSpace: "nowrap" }}>
          Round {gs.current_round} / {rules.number_of_rounds}
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
                <button
                  onClick={handleEndTurn}
                  disabled={isPending}
                  className="pc-btn pc-btn-ghost"
                  style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                >
                  End turn
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Budget display for non-clue-masters */}
        {!isClueMaster && (
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
          {chat.map((msg) => (
            <ChatLine key={msg.id} msg={msg} />
          ))}
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

          {isClueMaster ? (
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
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && guessInput.trim()) {
                    handleGuess(guessInput.trim());
                    setGuessInput("");
                  }
                }}
                placeholder="Type your guess…"
                className="pc-input"
                style={{ flex: 1, marginBottom: 0 }}
                disabled={isPending || !currentTerm?.current_clue_message_id}
              />
              <button
                onClick={() => {
                  handleGuess(guessInput.trim());
                  setGuessInput("");
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
          )}
        </div>
      </div>
    </div>
  );
}

// ── Chat line renderer ─────────────────────────────────────

function ChatLine({ msg }: { msg: ChatMessage }) {
  const sender = msg.lobby_players
    ? (msg.lobby_players.users?.display_name ?? msg.lobby_players.guest_name ?? "?")
    : null;

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
    <div style={{ fontSize: "0.85rem" }}>
      <span style={{ fontWeight: 700 }}>{sender}:</span>{" "}
      <span
        style={{
          color: meta.correct ? "var(--pc-green)" : "var(--pc-red-dark)",
          fontWeight: 700,
        }}
      >
        {meta.correct ? "✓" : "✗"}
      </span>{" "}
      {msg.content}
    </div>
  );
}
