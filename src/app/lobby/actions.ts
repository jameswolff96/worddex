"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateDisplayName } from "@/lib/game/nameGenerator";
import type { LobbyRules } from "@/lib/types/database";

export type LobbyError = { error: string };

const ALL_CATEGORIES = [
  "Pokémon",
  "Items",
  "Gym Leaders",
  "Games",
  "Towns & Cities",
  "Routes & Areas",
];

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

  const rules: LobbyRules = {
    number_of_rounds: Number(formData.get("number_of_rounds")) || 3,
    terms_per_turn: Number(formData.get("terms_per_turn")) || 5,
    word_budget: Number(formData.get("word_budget")) || 25,
    categories: categories.length > 0 ? categories : ALL_CATEGORIES,
    is_18_plus_mode: formData.get("is_18_plus_mode") === "true",
    clue_master_rotation:
      (formData.get(
        "clue_master_rotation"
      ) as LobbyRules["clue_master_rotation"]) ?? "round",
    classroom_scoring_mode:
      (formData.get(
        "classroom_scoring_mode"
      ) as LobbyRules["classroom_scoring_mode"]) ?? "first_correct",
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

  redirect(`/lobby/${lobby.code}`);
}

export async function joinLobby(
  lobbyId: string,
  isGuest: boolean
): Promise<LobbyError | undefined> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count } = await supabase
    .from("lobby_players")
    .select("id", { count: "exact", head: true })
    .eq("lobby_id", lobbyId);

  if (user && !isGuest) {
    const { data: existing } = await supabase
      .from("lobby_players")
      .select("id")
      .eq("lobby_id", lobbyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) return undefined; // already joined

    const { error } = await supabase.from("lobby_players").insert({
      lobby_id: lobbyId,
      user_id: user.id,
      join_order: count ?? 0,
    });
    if (error) return { error: error.message };
  } else {
    let guestName = await generateDisplayName();
    const { data: names } = await supabase
      .from("lobby_players")
      .select("guest_name")
      .eq("lobby_id", lobbyId);

    const taken = new Set(
      (names ?? []).map((p) => p.guest_name).filter(Boolean) as string[]
    );

    let attempts = 0;
    while (taken.has(guestName) && attempts < 10) {
      guestName = await generateDisplayName();
      attempts++;
    }

    const { error } = await supabase.from("lobby_players").insert({
      lobby_id: lobbyId,
      guest_name: guestName,
      join_order: count ?? 0,
    });
    if (error) return { error: error.message };
  }

  return undefined;
}
