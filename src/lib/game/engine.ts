"use server";

import { createClient } from "@/lib/supabase/server";
import { checkClue, analyzeClueMessage } from "./clueValidation";
import type {
  LobbyRules,
  SlotCell,
  CurrentTerm,
  GamePhase,
  GameStateRow,
} from "@/lib/types/database";

export type GameError = { error: string };

// ── Start a player/team's turn ─────────────────────────────

export async function startTurn(lobbyId: string): Promise<GameError | void> {
  const supabase = await createClient();

  const { data: gs } = await supabase
    .from("game_state")
    .select("*")
    .eq("lobby_id", lobbyId)
    .single();

  if (!gs) return { error: "Game state not found" };
  const gameState = gs as unknown as GameStateRow;

  const { data: lobby } = await supabase
    .from("lobbies")
    .select("rules, mode")
    .eq("id", lobbyId)
    .single();

  if (!lobby) return { error: "Lobby not found" };
  const rules = lobby.rules as unknown as LobbyRules;

  const term = await pickTerm(lobbyId, gameState.used_term_ids as number[], rules.categories);
  if (!term) return { error: "No terms available" };

  const budget = rules.word_budget;
  const slots: SlotCell[] = Array.from({ length: budget }, () => ({ kind: "empty" }));

  const currentTerm: CurrentTerm = {
    term: term.term,
    category: term.category,
    word_bank_id: term.id,
    current_clue_message_id: null,
  };

  const { error } = await supabase
    .from("game_state")
    .update({
      current_term: currentTerm as unknown as import("@/lib/types/database").Json,
      slot_grid: slots as unknown as import("@/lib/types/database").Json,
      used_words_this_turn: [],
      used_term_ids: [...(gameState.used_term_ids as number[]), term.id],
      phase: "clueing",
    })
    .eq("lobby_id", lobbyId);

  if (error) return { error: error.message };

  await supabase.from("chat_messages").insert({
    lobby_id: lobbyId,
    kind: "system",
    content: "A new term has been revealed. Start clueing!",
  });
}

// ── Submit a clue ──────────────────────────────────────────

export async function submitClue(
  lobbyId: string,
  playerIdInLobby: string,
  clueText: string
): Promise<GameError | { messageId: string }> {
  const supabase = await createClient();

  const { data: gs } = await supabase
    .from("game_state")
    .select("*")
    .eq("lobby_id", lobbyId)
    .single();

  if (!gs) return { error: "Game state not found" };
  const gameState = gs as unknown as GameStateRow;

  if (gameState.phase !== "clueing") return { error: "Not in clueing phase" };

  const currentTerm = gameState.current_term as unknown as CurrentTerm | null;
  if (!currentTerm) return { error: "No active term" };

  const check = checkClue(clueText, currentTerm.term);
  if (check.blocked) return { error: check.reason };

  const { data: lobby } = await supabase
    .from("lobbies")
    .select("rules")
    .eq("id", lobbyId)
    .single();
  const rules = lobby?.rules as unknown as LobbyRules;

  const usedWordsSet = new Set<string>(gameState.used_words_this_turn ?? []);
  const { newWords, cost } = analyzeClueMessage(clueText, usedWordsSet);

  const currentSlots = gameState.slot_grid as unknown as SlotCell[];
  const filledCount = currentSlots.filter((s) => s.kind !== "empty").length;
  const remainingSlots = currentSlots.length - filledCount;

  if (cost > remainingSlots) {
    return { error: `Not enough word budget (need ${cost}, have ${remainingSlots})` };
  }

  // Fill slots for new words
  const updatedSlots: SlotCell[] = [...currentSlots];
  let slotIdx = filledCount;
  for (const word of newWords) {
    if (slotIdx < updatedSlots.length) {
      updatedSlots[slotIdx] = { kind: "filled", word };
      slotIdx++;
    }
  }

  const updatedUsedWords = [
    ...(gameState.used_words_this_turn ?? []),
    ...newWords.map((w) => w.toLowerCase()),
  ];

  const { data: msg, error: msgError } = await supabase
    .from("chat_messages")
    .insert({
      lobby_id: lobbyId,
      sender_player_id: playerIdInLobby,
      content: clueText,
      kind: "clue",
      metadata: { cost, new_words: newWords },
    })
    .select("id")
    .single();

  if (msgError || !msg) return { error: msgError?.message ?? "Failed to send clue" };

  const updatedTerm: CurrentTerm = {
    ...currentTerm,
    current_clue_message_id: msg.id,
  };

  await supabase
    .from("game_state")
    .update({
      current_term: updatedTerm as unknown as import("@/lib/types/database").Json,
      slot_grid: updatedSlots as unknown as import("@/lib/types/database").Json,
      used_words_this_turn: updatedUsedWords,
    })
    .eq("lobby_id", lobbyId);

  return { messageId: msg.id };
}

// ── Submit a guess ─────────────────────────────────────────

export async function submitGuess(
  lobbyId: string,
  playerIdInLobby: string,
  guessedTerm: string
): Promise<GameError | { correct: boolean }> {
  const supabase = await createClient();

  const { data: gs } = await supabase
    .from("game_state")
    .select("*")
    .eq("lobby_id", lobbyId)
    .single();

  if (!gs) return { error: "Game state not found" };
  const gameState = gs as unknown as GameStateRow;

  if (gameState.phase !== "clueing") return { error: "Not in clueing phase" };

  const currentTerm = gameState.current_term as unknown as CurrentTerm | null;
  if (!currentTerm) return { error: "No active term" };

  const clueMessageId = currentTerm.current_clue_message_id;
  if (!clueMessageId) return { error: "No clue has been given yet" };

  const { data: existingGuess } = await supabase
    .from("guess_log")
    .select("id")
    .eq("clue_message_id", clueMessageId)
    .eq("player_id", playerIdInLobby)
    .maybeSingle();

  if (existingGuess) return { error: "You have already guessed for this clue" };

  const correct =
    guessedTerm.trim().toLowerCase() === currentTerm.term.toLowerCase();

  await supabase.from("guess_log").insert({
    lobby_id: lobbyId,
    clue_message_id: clueMessageId,
    player_id: playerIdInLobby,
    term: guessedTerm,
    correct,
  });

  const { data: lobby } = await supabase
    .from("lobbies")
    .select("mode, rules")
    .eq("id", lobbyId)
    .single();

  await supabase.from("chat_messages").insert({
    lobby_id: lobbyId,
    sender_player_id: playerIdInLobby,
    content: guessedTerm,
    kind: "guess",
    metadata: { correct, term: currentTerm.term },
  });

  if (correct) {
    const mode = lobby?.mode;
    if (mode === "solo") {
      await supabase.rpc("increment_player_score", {
        p_player_id: playerIdInLobby,
        p_amount: 1,
      });
    } else {
      const { data: player } = await supabase
        .from("lobby_players")
        .select("team_id")
        .eq("id", playerIdInLobby)
        .single();
      if (player?.team_id) {
        await supabase.rpc("increment_team_score", {
          p_team_id: player.team_id,
          p_amount: 1,
        });
      }
    }

    const rules = lobby?.rules as unknown as LobbyRules;
    if (
      mode === "classroom_streamer" &&
      rules.classroom_scoring_mode === "first_correct"
    ) {
      await advanceToNextTerm(lobbyId, gameState);
    }
  }

  return { correct };
}

// ── Reroll (solo / classroom) ──────────────────────────────

export async function rerollTerm(lobbyId: string): Promise<GameError | void> {
  const supabase = await createClient();

  const { data: gs } = await supabase
    .from("game_state")
    .select("*")
    .eq("lobby_id", lobbyId)
    .single();

  if (!gs) return { error: "Game state not found" };
  const gameState = gs as unknown as GameStateRow;

  if (gameState.phase !== "clueing") return { error: "Not in clueing phase" };

  const { data: lobby } = await supabase
    .from("lobbies")
    .select("rules")
    .eq("id", lobbyId)
    .single();
  const rules = lobby?.rules as unknown as LobbyRules;

  const currentSlots = gameState.slot_grid as unknown as SlotCell[];
  const filledCount = currentSlots.filter((s) => s.kind !== "empty").length;
  const remainingSlots = currentSlots.length - filledCount;

  if (remainingSlots === 0) {
    return { error: "Budget is 0 — cannot reroll (use forced skip instead)" };
  }

  const updatedSlots: SlotCell[] = [...currentSlots];
  updatedSlots[filledCount] = { kind: "reroll" };

  const newTerm = await pickTerm(
    lobbyId,
    gameState.used_term_ids as number[],
    rules.categories
  );
  if (!newTerm) return { error: "No more terms available" };

  const updatedTerm: CurrentTerm = {
    term: newTerm.term,
    category: newTerm.category,
    word_bank_id: newTerm.id,
    current_clue_message_id: null,
  };

  await supabase
    .from("game_state")
    .update({
      current_term: updatedTerm as unknown as import("@/lib/types/database").Json,
      slot_grid: updatedSlots as unknown as import("@/lib/types/database").Json,
      used_term_ids: [
        ...(gameState.used_term_ids as number[]),
        newTerm.id,
      ],
    })
    .eq("lobby_id", lobbyId);

  await supabase.from("chat_messages").insert({
    lobby_id: lobbyId,
    kind: "system",
    content: "The Clue Master rerolled to a new term.",
  });
}

// ── Forced skip at 0 budget (solo) ────────────────────────

export async function forcedSkip(
  lobbyId: string,
  clueMasterPlayerIdInLobby: string
): Promise<GameError | void> {
  const supabase = await createClient();

  const { data: gs } = await supabase
    .from("game_state")
    .select("*")
    .eq("lobby_id", lobbyId)
    .single();

  if (!gs) return { error: "Game state not found" };
  const gameState = gs as unknown as GameStateRow;

  await supabase.rpc("increment_player_score", {
    p_player_id: clueMasterPlayerIdInLobby,
    p_amount: -1,
  });

  await supabase.from("chat_messages").insert({
    lobby_id: lobbyId,
    kind: "system",
    content: "Out of budget — term skipped. -1 point.",
  });

  await advanceToNextTerm(lobbyId, gameState);
}

// ── Skip (teams mode — free) ───────────────────────────────

export async function skipTerm(lobbyId: string): Promise<GameError | void> {
  const supabase = await createClient();

  const { data: gs } = await supabase
    .from("game_state")
    .select("*")
    .eq("lobby_id", lobbyId)
    .single();

  if (!gs) return { error: "Game state not found" };
  const gameState = gs as unknown as GameStateRow;

  await supabase.from("chat_messages").insert({
    lobby_id: lobbyId,
    kind: "system",
    content: "Term skipped.",
  });

  await advanceToNextTerm(lobbyId, gameState);
}

// ── Advance to next term or end turn ──────────────────────

async function advanceToNextTerm(lobbyId: string, gameState: GameStateRow) {
  const supabase = await createClient();

  const { data: lobby } = await supabase
    .from("lobbies")
    .select("rules")
    .eq("id", lobbyId)
    .single();
  const rules = lobby?.rules as unknown as LobbyRules;

  const nextTerm = await pickTerm(
    lobbyId,
    gameState.used_term_ids as number[],
    rules.categories
  );

  if (!nextTerm) {
    await endTurn(lobbyId, gameState);
    return;
  }

  const updatedTerm: CurrentTerm = {
    term: nextTerm.term,
    category: nextTerm.category,
    word_bank_id: nextTerm.id,
    current_clue_message_id: null,
  };

  await supabase
    .from("game_state")
    .update({
      current_term: updatedTerm as unknown as import("@/lib/types/database").Json,
      used_term_ids: [
        ...(gameState.used_term_ids as number[]),
        nextTerm.id,
      ],
    })
    .eq("lobby_id", lobbyId);

  await supabase.from("chat_messages").insert({
    lobby_id: lobbyId,
    kind: "system",
    content: "Next term!",
  });
}

// ── End turn ──────────────────────────────────────────────

export async function endTurn(
  lobbyId: string,
  existingGs?: GameStateRow
): Promise<GameError | void> {
  const supabase = await createClient();

  let gameState: GameStateRow;
  if (existingGs) {
    gameState = existingGs;
  } else {
    const { data: gs } = await supabase
      .from("game_state")
      .select("*")
      .eq("lobby_id", lobbyId)
      .single();
    if (!gs) return { error: "Game state not found" };
    gameState = gs as unknown as GameStateRow;
  }

  const slots = gameState.slot_grid as unknown as SlotCell[];
  const emptyCount = slots.filter((s) => s.kind === "empty").length;

  const { data: lobby } = await supabase
    .from("lobbies")
    .select("mode, rules")
    .eq("id", lobbyId)
    .single();
  const mode = lobby?.mode;

  if (emptyCount > 0 && mode !== "classroom_streamer") {
    if (mode === "solo") {
      const turnPlayerId = gameState.current_turn_player_id;
      if (turnPlayerId) {
        await supabase.rpc("increment_player_score", {
          p_player_id: turnPlayerId,
          p_amount: emptyCount,
        });
      }
    } else {
      const teamId = gameState.current_team_id;
      if (teamId) {
        await supabase.rpc("increment_team_score", {
          p_team_id: teamId,
          p_amount: emptyCount,
        });
      }
    }
  }

  const bonusNote =
    emptyCount > 0 && mode !== "classroom_streamer"
      ? ` +${emptyCount} bonus point${emptyCount !== 1 ? "s" : ""} for unused slots.`
      : "";

  await supabase.from("chat_messages").insert({
    lobby_id: lobbyId,
    kind: "system",
    content: `Turn complete!${bonusNote}`,
    metadata: { empty_slots: emptyCount },
  });

  await supabase
    .from("game_state")
    .update({ phase: "turn_end" })
    .eq("lobby_id", lobbyId);
}

// ── Helpers ────────────────────────────────────────────────

async function pickTerm(
  lobbyId: string,
  usedIds: number[],
  categories: string[]
): Promise<{ id: number; term: string; category: string } | null> {
  const supabase = await createClient();

  // Get lobby's used_term_ids to exclude cross-turn duplication
  let query = supabase
    .from("word_bank")
    .select("id, term, category")
    .eq("is_active", true)
    .in("category", categories);

  if (usedIds.length > 0) {
    query = query.not("id", "in", `(${usedIds.join(",")})`);
  }

  const { data } = await query;
  if (!data || data.length === 0) return null;

  const rows = data as { id: number; term: string; category: string }[];
  return rows[Math.floor(Math.random() * rows.length)];
}
