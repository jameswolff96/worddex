import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { GameClient } from "./GameClient";
import type { LobbyRules, CurrentTerm, SlotCell, GamePhase } from "@/lib/types/database";

interface Props {
  params: Promise<{ code: string }>;
}

interface LobbyData {
  id: string;
  code: string;
  mode: "teams" | "solo" | "classroom_streamer";
  rules: LobbyRules;
  status: "waiting" | "playing" | "finished";
  host_user_id: string;
  classroom_clue_giver_player_id: string | null;
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
    clue_master_rotation_index: number;
  }>;
}

interface GameStateData {
  lobby_id: string;
  current_round: number;
  current_turn_player_id: string | null;
  current_team_id: string | null;
  current_term: CurrentTerm | null;
  slot_grid: SlotCell[];
  used_words_this_turn: string[];
  used_term_ids: number[];
  terms_completed_this_turn: number;
  phase: GamePhase;
  player_word_banks: Record<string, { slot_grid: SlotCell[]; used_words: string[] }>;
  player_term_counts: Record<string, number>;
}

interface ChatData {
  id: string;
  content: string;
  kind: "clue" | "guess" | "system";
  metadata: Record<string, unknown>;
  created_at: string;
  sender_player_id: string | null;
  lobby_players: {
    guest_name: string | null;
    users: { display_name: string; discriminator: number } | null;
  } | null;
}

export default async function PlayPage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rawLobby } = await supabase
    .from("lobbies")
    .select(
      "id, code, mode, rules, status, host_user_id, classroom_clue_giver_player_id, lobby_players(id, user_id, guest_name, team_id, connection_status, join_order, score, users(id, display_name, discriminator, avatar)), lobby_teams(id, name, score, turn_order, clue_master_rotation_index)"
    )
    .eq("code", code.toUpperCase())
    .single();

  if (!rawLobby) notFound();

  const lobby = rawLobby as unknown as LobbyData;

  if (lobby.status === "waiting") redirect(`/lobby/${code}`);

  const { data: rawGs } = await supabase
    .from("game_state")
    .select("*")
    .eq("lobby_id", lobby.id)
    .single();

  const gameState = rawGs ? (rawGs as unknown as GameStateData) : null;

  const { data: rawChat } = await supabase
    .from("chat_messages")
    .select("id, content, kind, metadata, created_at, sender_player_id")
    .eq("lobby_id", lobby.id)
    .order("created_at", { ascending: true })
    .limit(200);

  const chatHistory: ChatData[] = (rawChat ?? []).map((m) => ({
    id: m.id,
    content: m.content,
    kind: m.kind,
    metadata: (m.metadata as Record<string, unknown>) ?? {},
    created_at: m.created_at,
    sender_player_id: m.sender_player_id,
    lobby_players: null,
  }));

  const myPlayer = user
    ? lobby.lobby_players.find((p) => p.user_id === user.id)
    : null;

  const { data: rawWordBank } = await supabase
    .from("word_bank")
    .select("term, category, sprite_ref")
    .eq("is_active", true)
    .in("category", lobby.rules.categories);
  const wordBank = (rawWordBank ?? []) as { term: string; category: string; sprite_ref: string | null }[];

  return (
    <GameClient
      lobby={lobby}
      initialGameState={gameState}
      initialChat={chatHistory}
      currentUserId={user?.id ?? null}
      myPlayerId={myPlayer?.id ?? null}
      wordBank={wordBank}
      classroomClueGiverId={lobby.classroom_clue_giver_player_id}
    />
  );
}
