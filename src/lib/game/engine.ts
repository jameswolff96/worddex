"use server";

import { createClient } from "@/lib/supabase/server";
import { checkClue, analyzeClueMessage } from "./clueValidation";
import { filterContent } from "./contentFilter";
import type {
  LobbyRules,
  SlotCell,
  CurrentTerm,
  GamePhase,
  GameStateRow,
} from "@/lib/types/database";

export type GameError = { error: string };

// ── Initialize the game (called once when host starts) ─────

export async function initializeGame(lobbyId: string): Promise<GameError | void> {
  const supabase = await createClient();

  const { data: lobby } = await supabase
    .from("lobbies")
    .select("mode, rules")
    .eq("id", lobbyId)
    .single();
  if (!lobby) return { error: "Lobby not found" };

  const mode = lobby.mode as string;
  const rules = lobby.rules as unknown as LobbyRules;

  let firstPlayerId: string | null = null;
  let firstTeamId: string | null = null;

  if (mode === "teams") {
    const { data: teams } = await supabase
      .from("lobby_teams")
      .select("id")
      .eq("lobby_id", lobbyId)
      .order("turn_order")
      .limit(1);
    firstTeamId = teams?.[0]?.id ?? null;

    if (firstTeamId) {
      const { data: teamPlayers } = await supabase
        .from("lobby_players")
        .select("id")
        .eq("lobby_id", lobbyId)
        .eq("team_id", firstTeamId)
        .order("join_order")
        .limit(1);
      firstPlayerId = teamPlayers?.[0]?.id ?? null;
    }
  } else {
    const { data: players } = await supabase
      .from("lobby_players")
      .select("id")
      .eq("lobby_id", lobbyId)
      .order("join_order")
      .limit(1);
    firstPlayerId = players?.[0]?.id ?? null;
  }

  const term = await pickTerm(lobbyId, [], rules.categories);
  if (!term) return { error: "No terms available in the selected categories" };

  const slots: SlotCell[] = Array.from({ length: rules.word_budget }, () => ({ kind: "empty" as const }));
  const currentTerm: CurrentTerm = {
    term: term.term,
    category: term.category,
    word_bank_id: term.id,
    sprite_ref: term.sprite_ref,
    current_clue_message_id: null,
  };

  const { error } = await supabase
    .from("game_state")
    .update({
      current_round: 1,
      current_turn_player_id: firstPlayerId,
      current_team_id: firstTeamId,
      current_term: currentTerm as unknown as import("@/lib/types/database").Json,
      slot_grid: slots as unknown as import("@/lib/types/database").Json,
      used_words_this_turn: [],
      used_term_ids: [term.id],
      terms_completed_this_turn: 0,
      phase: "clueing",
    })
    .eq("lobby_id", lobbyId);

  if (error) return { error: error.message };

  if (mode === "classroom_streamer" && firstPlayerId) {
    await supabase
      .from("lobbies")
      .update({ classroom_clue_giver_player_id: firstPlayerId })
      .eq("id", lobbyId);
  }

  await supabase.from("chat_messages").insert({
    lobby_id: lobbyId,
    kind: "system",
    content: "Game started! First term is ready.",
    metadata: {},
  });
}

// ── Advance to next player/team's turn ────────────────────

export async function advanceTurn(lobbyId: string): Promise<GameError | void> {
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
    .select("mode, rules")
    .eq("id", lobbyId)
    .single();
  if (!lobby) return { error: "Lobby not found" };

  const mode = lobby.mode as string;
  const rules = lobby.rules as unknown as LobbyRules;
  const totalRounds = rules.number_of_rounds;

  let nextPlayerId: string | null = null;
  let nextTeamId: string | null = null;
  let nextRound = gameState.current_round;
  let isNewRound = false;

  if (mode === "solo") {
    const { data: players } = await supabase
      .from("lobby_players")
      .select("id, join_order")
      .eq("lobby_id", lobbyId)
      .order("join_order");
    if (!players?.length) return { error: "No players found" };

    const currentIdx = players.findIndex((p) => p.id === gameState.current_turn_player_id);
    const nextIdx = currentIdx + 1;
    if (nextIdx >= players.length) {
      nextRound++;
      isNewRound = true;
      nextPlayerId = players[0].id;
    } else {
      nextPlayerId = players[nextIdx].id;
    }

  } else if (mode === "teams") {
    const { data: teams } = await supabase
      .from("lobby_teams")
      .select("id, turn_order")
      .eq("lobby_id", lobbyId)
      .order("turn_order");
    if (!teams?.length) return { error: "No teams found" };

    const currentIdx = teams.findIndex((t) => t.id === gameState.current_team_id);
    const nextIdx = currentIdx + 1;
    if (nextIdx >= teams.length) {
      nextRound++;
      isNewRound = true;
      nextTeamId = teams[0].id;
    } else {
      nextTeamId = teams[nextIdx].id;
    }

    if (nextTeamId) {
      const { data: teamPlayers } = await supabase
        .from("lobby_players")
        .select("id")
        .eq("lobby_id", lobbyId)
        .eq("team_id", nextTeamId)
        .order("join_order")
        .limit(1);
      nextPlayerId = teamPlayers?.[0]?.id ?? null;
    }

  } else {
    // classroom_streamer: same clue giver, just new round
    nextPlayerId = gameState.current_turn_player_id;
    nextRound++;
    isNewRound = true;
  }

  if (nextRound > totalRounds) {
    await supabase.from("game_state").update({ phase: "game_over" }).eq("lobby_id", lobbyId);
    await supabase.from("lobbies").update({ status: "finished" }).eq("id", lobbyId);
    await supabase.from("chat_messages").insert({
      lobby_id: lobbyId,
      kind: "system",
      content: "Game over! Final scores above.",
      metadata: {},
    });
    await recordGameOverStats(lobbyId, mode);
    return;
  }

  const term = await pickTerm(
    lobbyId,
    gameState.used_term_ids as number[],
    rules.categories
  );
  if (!term) return { error: "No more terms available" };

  const slots: SlotCell[] = Array.from({ length: rules.word_budget }, () => ({ kind: "empty" as const }));
  const currentTerm: CurrentTerm = {
    term: term.term,
    category: term.category,
    word_bank_id: term.id,
    sprite_ref: term.sprite_ref,
    current_clue_message_id: null,
  };

  await supabase
    .from("game_state")
    .update({
      current_round: nextRound,
      current_turn_player_id: nextPlayerId,
      current_team_id: nextTeamId,
      current_term: currentTerm as unknown as import("@/lib/types/database").Json,
      slot_grid: slots as unknown as import("@/lib/types/database").Json,
      used_words_this_turn: [],
      used_term_ids: [...(gameState.used_term_ids as number[]), term.id],
      terms_completed_this_turn: 0,
      phase: "clueing",
    })
    .eq("lobby_id", lobbyId);

  await supabase.from("chat_messages").insert({
    lobby_id: lobbyId,
    kind: "system",
    content: isNewRound ? `Round ${nextRound} begins!` : "Next team's turn!",
    metadata: {},
  });
}

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
    sprite_ref: term.sprite_ref,
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

  const contentCheck = filterContent(clueText, rules.is_18_plus_mode);
  if (contentCheck.blocked) return { error: contentCheck.reason };

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

  if (correct) {
    const { data: guesserRow } = await supabase
      .from("lobby_players")
      .select("user_id")
      .eq("id", playerIdInLobby)
      .single();
    if (guesserRow?.user_id) {
      await supabase.rpc("increment_stat", {
        p_user_id: guesserRow.user_id,
        p_terms_guessed: 1,
      });
    }
  }

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
    if (mode === "classroom_streamer" && rules.classroom_scoring_mode === "first_correct") {
      await advanceToNextTerm(lobbyId, gameState, true);
    } else {
      const completedThisTurn = ((gameState.terms_completed_this_turn as number) ?? 0) + 1;
      const isFinal = completedThisTurn >= rules.terms_per_turn;
      if (isFinal) {
        await supabase.from("chat_messages").insert({
          lobby_id: lobbyId,
          kind: "system",
          content: `✓ Correct! Turn complete — advancing in 10 seconds.`,
          metadata: { countdown: true },
        });
        await supabase.from("game_state").update({
          phase: "correct_guess",
          terms_completed_this_turn: completedThisTurn,
        }).eq("lobby_id", lobbyId);
      } else {
        await advanceToNextTerm(lobbyId, gameState, true);
      }
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
    sprite_ref: newTerm.sprite_ref,
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

async function advanceToNextTerm(lobbyId: string, gameState: GameStateRow, wasCorrect = false) {
  const supabase = await createClient();

  const { data: lobby } = await supabase
    .from("lobbies")
    .select("rules")
    .eq("id", lobbyId)
    .single();
  const rules = lobby?.rules as unknown as LobbyRules;

  const completedSoFar = (gameState.terms_completed_this_turn as number) ?? 0;
  const newCompleted = wasCorrect ? completedSoFar + 1 : completedSoFar;

  if (newCompleted >= rules.terms_per_turn) {
    await supabase
      .from("game_state")
      .update({ terms_completed_this_turn: newCompleted })
      .eq("lobby_id", lobbyId);
    await endTurn(lobbyId, gameState);
    return;
  }

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
    sprite_ref: nextTerm.sprite_ref,
    current_clue_message_id: null,
  };

  await supabase
    .from("game_state")
    .update({
      current_term: updatedTerm as unknown as import("@/lib/types/database").Json,
      used_term_ids: [...(gameState.used_term_ids as number[]), nextTerm.id],
      terms_completed_this_turn: newCompleted,
    })
    .eq("lobby_id", lobbyId);

  await supabase.from("chat_messages").insert({
    lobby_id: lobbyId,
    kind: "system",
    content: wasCorrect
      ? `✓ Term ${newCompleted}/${rules.terms_per_turn} complete! Next term…`
      : "Term skipped. Next term!",
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

async function recordGameOverStats(lobbyId: string, mode: string) {
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("lobby_players")
    .select("user_id, score, team_id")
    .eq("lobby_id", lobbyId)
    .not("user_id", "is", null);

  if (!players?.length) return;

  let winnerUserIds = new Set<string>();

  if (mode === "solo") {
    const maxScore = Math.max(...players.map((p) => p.score));
    winnerUserIds = new Set(
      players.filter((p) => p.score === maxScore && p.user_id).map((p) => p.user_id!)
    );
  } else if (mode === "teams") {
    const { data: teams } = await supabase
      .from("lobby_teams")
      .select("id, score")
      .eq("lobby_id", lobbyId);
    if (teams?.length) {
      const maxTeamScore = Math.max(...teams.map((t) => t.score));
      const winningTeamIds = new Set(
        teams.filter((t) => t.score === maxTeamScore).map((t) => t.id)
      );
      winnerUserIds = new Set(
        players
          .filter((p) => p.team_id && winningTeamIds.has(p.team_id) && p.user_id)
          .map((p) => p.user_id!)
      );
    }
  }
  // classroom_streamer has no winner — everyone gets games_played only

  await Promise.all(
    players
      .filter((p) => p.user_id)
      .map((p) =>
        supabase.rpc("increment_stat", {
          p_user_id: p.user_id!,
          p_games_played: 1,
          p_games_won: winnerUserIds.has(p.user_id!) ? 1 : 0,
        })
      )
  );
}

async function pickTerm(
  lobbyId: string,
  usedIds: number[],
  categories: string[]
): Promise<{ id: number; term: string; category: string; sprite_ref: string | null } | null> {
  const supabase = await createClient();

  // Get lobby's used_term_ids to exclude cross-turn duplication
  let query = supabase
    .from("word_bank")
    .select("id, term, category, sprite_ref")
    .eq("is_active", true)
    .in("category", categories);

  if (usedIds.length > 0) {
    query = query.not("id", "in", `(${usedIds.join(",")})`);
  }

  const { data } = await query;
  if (!data || data.length === 0) return null;

  const rows = data as { id: number; term: string; category: string; sprite_ref: string | null }[];
  return rows[Math.floor(Math.random() * rows.length)];
}
