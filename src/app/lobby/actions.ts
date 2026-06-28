"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { initializeGame } from "@/lib/game/engine";
import type { LobbyRules } from "@/lib/types/database";

export type LobbyError = { error: string };


export async function createLobby(
  _prev: LobbyError | undefined,
  formData: FormData
): Promise<LobbyError | undefined> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "You must be signed in to create a lobby. Sign in or create a free account.",
    };
  }

  const mode = (formData.get("mode") ?? "teams") as
    | "teams"
    | "solo"
    | "classroom_streamer";
  const visibility = (formData.get("visibility") ?? "public") as
    | "public"
    | "private";
  const categories = formData.getAll("categories") as string[];
  if (categories.length === 0) return { error: "Please select at least one category." };

  const rules: LobbyRules = {
    number_of_rounds: Number(formData.get("number_of_rounds")) || 3,
    terms_per_turn: Number(formData.get("terms_per_turn")) || 5,
    word_budget: Number(formData.get("word_budget")) || 25,
    number_of_teams: Math.min(6, Math.max(2, Number(formData.get("number_of_teams")) || 2)),
    categories,
    is_18_plus_mode: formData.get("is_18_plus_mode") === "true",
    clue_master_rotation:
      (formData.get(
        "clue_master_rotation"
      ) as LobbyRules["clue_master_rotation"]) ?? "round",
    classroom_scoring_mode:
      (formData.get(
        "classroom_scoring_mode"
      ) as LobbyRules["classroom_scoring_mode"]) ?? "first_correct",
    ffa_term_rotation: formData.get("ffa_term_rotation") === "true",
  };

  const { data: lobbyCode, error: codeError } = await supabase.rpc(
    "generate_lobby_code"
  );
  if (codeError || !lobbyCode) {
    return { error: "Failed to generate lobby code" };
  }

  const { data: lobby, error: lobbyError } = await supabase
    .from("lobbies")
    .insert({
      code: lobbyCode as string,
      host_user_id: user.id,
      visibility,
      mode,
      rules: rules as unknown as import("@/lib/types/database").Json,
    })
    .select("id, code")
    .single();

  if (lobbyError || !lobby) {
    return { error: lobbyError?.message ?? "Failed to create lobby" };
  }

  await supabase.from("lobby_players").insert({
    lobby_id: lobby.id,
    user_id: user.id,
    join_order: 0,
  });

  await supabase.from("game_state").insert({
    lobby_id: lobby.id,
    phase: "waiting",
  });

  if (mode === "teams") {
    const teamNames = ["Red", "Blue", "Green", "Purple", "Orange", "Teal"];
    const teamRows = Array.from({ length: rules.number_of_teams }, (_, i) => ({
      lobby_id: lobby.id,
      name: `Team ${teamNames[i]}`,
      turn_order: i,
    }));
    await supabase.from("lobby_teams").insert(teamRows);
  }

  redirect(`/lobby/${lobby.code}`);
}

export async function startGame(lobbyId: string): Promise<LobbyError | undefined> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: lobby } = await supabase
    .from("lobbies")
    .select("mode, host_user_id")
    .eq("id", lobbyId)
    .single();
  if (!lobby || lobby.host_user_id !== user.id) return { error: "Only the host can start the game" };

  const { count } = await supabase
    .from("lobby_players")
    .select("id", { count: "exact", head: true })
    .eq("lobby_id", lobbyId);

  if (!count || count < 2) return { error: "Need at least 2 players to start" };

  if (lobby.mode === "teams") {
    const { data: teams } = await supabase
      .from("lobby_teams")
      .select("id")
      .eq("lobby_id", lobbyId);

    for (const team of teams ?? []) {
      const { count: teamCount } = await supabase
        .from("lobby_players")
        .select("id", { count: "exact", head: true })
        .eq("lobby_id", lobbyId)
        .eq("team_id", team.id);
      if (!teamCount || teamCount < 2) {
        return { error: "Each team must have at least 2 players before starting" };
      }
    }
  }

  const { error: updateError } = await supabase
    .from("lobbies")
    .update({ status: "playing" })
    .eq("id", lobbyId)
    .eq("host_user_id", user.id);

  if (updateError) return { error: updateError.message };

  const initError = await initializeGame(lobbyId);
  if (initError) return initError;
}

export async function joinTeam(
  lobbyId: string,
  teamId: string
): Promise<LobbyError | undefined> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: player } = await supabase
    .from("lobby_players")
    .select("id")
    .eq("lobby_id", lobbyId)
    .eq("user_id", user.id)
    .single();
  if (!player) return { error: "You are not in this lobby" };

  const { error } = await supabase
    .from("lobby_players")
    .update({ team_id: teamId })
    .eq("id", player.id);
  if (error) return { error: error.message };
}

export async function joinLobby(lobbyId: string): Promise<LobbyError | undefined> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { count } = await supabase
    .from("lobby_players")
    .select("id", { count: "exact", head: true })
    .eq("lobby_id", lobbyId);

  const { data: existing } = await supabase
    .from("lobby_players")
    .select("id")
    .eq("lobby_id", lobbyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return undefined;

  const { error } = await supabase.from("lobby_players").insert({
    lobby_id: lobbyId,
    user_id: user.id,
    join_order: count ?? 0,
  });
  if (error) return { error: error.message };

  return undefined;
}

export async function kickPlayer(
  lobbyId: string,
  playerIdToKick: string
): Promise<LobbyError | undefined> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: lobby } = await supabase
    .from("lobbies")
    .select("host_user_id")
    .eq("id", lobbyId)
    .single();

  if (!lobby || lobby.host_user_id !== user.id) return { error: "Only the host can kick players" };

  const { error } = await supabase
    .from("lobby_players")
    .delete()
    .eq("id", playerIdToKick)
    .eq("lobby_id", lobbyId);

  if (error) return { error: error.message };
  return undefined;
}

export async function endGame(lobbyId: string): Promise<LobbyError | undefined> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: lobby } = await supabase
    .from("lobbies")
    .select("host_user_id")
    .eq("id", lobbyId)
    .single();
  if (!lobby || lobby.host_user_id !== user.id) return { error: "Only the host can end the game" };

  await supabase.from("chat_messages").insert({
    lobby_id: lobbyId,
    kind: "system",
    content: "🛑 The host ended the game.",
    metadata: {},
  });

  const { error } = await supabase
    .from("game_state")
    .update({ phase: "game_over" })
    .eq("lobby_id", lobbyId);
  if (error) return { error: error.message };

  await supabase.from("lobbies").update({ status: "finished" }).eq("id", lobbyId);
}

export async function cancelLobby(lobbyId: string): Promise<LobbyError | undefined> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("lobbies")
    .update({ status: "finished" })
    .eq("id", lobbyId)
    .eq("host_user_id", user.id);
  if (error) return { error: error.message };
}

export async function abandonGame(
  lobbyId: string,
  playerId: string
): Promise<LobbyError | undefined> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("lobby_players")
    .delete()
    .eq("id", playerId)
    .eq("lobby_id", lobbyId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
}
