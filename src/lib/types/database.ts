export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string;
          discriminator: number;
          avatar: string | null;
          created_at: string;
          last_data_export_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name: string;
          discriminator: number;
          avatar?: string | null;
          created_at?: string;
          last_data_export_at?: string | null;
        };
        Update: {
          display_name?: string;
          discriminator?: number;
          avatar?: string | null;
          last_data_export_at?: string | null;
        };
        Relationships: [];
      };
      discriminator_counters: {
        Row: { display_name_lower: string; next_value: number };
        Insert: { display_name_lower: string; next_value?: number };
        Update: { next_value?: number };
        Relationships: [];
      };
      adjectives: {
        Row: { id: number; word: string };
        Insert: { word: string };
        Update: { word?: string };
        Relationships: [];
      };
      word_bank: {
        Row: {
          id: number;
          term: string;
          category: string;
          sprite_ref: string | null;
          is_active: boolean;
        };
        Insert: {
          term: string;
          category: string;
          sprite_ref?: string | null;
          is_active?: boolean;
        };
        Update: {
          term?: string;
          category?: string;
          sprite_ref?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      lobbies: {
        Row: {
          id: string;
          code: string;
          host_user_id: string;
          visibility: "public" | "private";
          status: "waiting" | "playing" | "finished";
          mode: "teams" | "solo" | "classroom_streamer";
          rules: Json;
          classroom_clue_giver_player_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          host_user_id: string;
          visibility?: "public" | "private";
          status?: "waiting" | "playing" | "finished";
          mode: "teams" | "solo" | "classroom_streamer";
          rules: Json;
          classroom_clue_giver_player_id?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "waiting" | "playing" | "finished";
          rules?: Json;
          classroom_clue_giver_player_id?: string | null;
        };
        Relationships: [];
      };
      lobby_teams: {
        Row: {
          id: string;
          lobby_id: string;
          name: string;
          score: number;
          clue_master_rotation_index: number;
          turn_order: number;
        };
        Insert: {
          id?: string;
          lobby_id: string;
          name: string;
          score?: number;
          clue_master_rotation_index?: number;
          turn_order: number;
        };
        Update: {
          name?: string;
          score?: number;
          clue_master_rotation_index?: number;
        };
        Relationships: [];
      };
      lobby_players: {
        Row: {
          id: string;
          lobby_id: string;
          team_id: string | null;
          user_id: string | null;
          guest_name: string | null;
          connection_status: "connected" | "disconnected";
          join_order: number;
          score: number;
        };
        Insert: {
          id?: string;
          lobby_id: string;
          team_id?: string | null;
          user_id?: string | null;
          guest_name?: string | null;
          connection_status?: "connected" | "disconnected";
          join_order?: number;
          score?: number;
        };
        Update: {
          team_id?: string | null;
          connection_status?: "connected" | "disconnected";
          score?: number;
        };
        Relationships: [];
      };
      game_state: {
        Row: {
          lobby_id: string;
          current_round: number;
          current_turn_player_id: string | null;
          current_team_id: string | null;
          current_term: Json | null;
          slot_grid: Json;
          used_words_this_turn: string[];
          used_term_ids: number[];
          terms_completed_this_turn: number;
          phase: string;
          updated_at: string;
          player_word_banks: Json;
          player_term_counts: Json;
        };
        Insert: {
          lobby_id: string;
          current_round?: number;
          current_turn_player_id?: string | null;
          current_team_id?: string | null;
          current_term?: Json | null;
          slot_grid?: Json;
          used_words_this_turn?: string[];
          used_term_ids?: number[];
          terms_completed_this_turn?: number;
          phase?: string;
          updated_at?: string;
          player_word_banks?: Json;
          player_term_counts?: Json;
        };
        Update: {
          current_round?: number;
          current_turn_player_id?: string | null;
          current_team_id?: string | null;
          current_term?: Json | null;
          slot_grid?: Json;
          used_words_this_turn?: string[];
          used_term_ids?: number[];
          terms_completed_this_turn?: number;
          phase?: string;
          updated_at?: string;
          player_word_banks?: Json;
          player_term_counts?: Json;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          lobby_id: string;
          sender_player_id: string | null;
          content: string;
          kind: "clue" | "guess" | "system";
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          lobby_id: string;
          sender_player_id?: string | null;
          content: string;
          kind: "clue" | "guess" | "system";
          metadata?: Json;
        };
        Update: {
          [_ in never]: never;
        };
        Relationships: [];
      };
      guess_log: {
        Row: {
          id: string;
          lobby_id: string;
          clue_message_id: string;
          player_id: string;
          term: string;
          correct: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          lobby_id: string;
          clue_message_id: string;
          player_id: string;
          term: string;
          correct: boolean;
        };
        Update: {
          [_ in never]: never;
        };
        Relationships: [];
      };
      stats: {
        Row: {
          user_id: string;
          games_played: number;
          games_won: number;
          terms_guessed: number;
          favorite_category: string | null;
        };
        Insert: {
          user_id: string;
          games_played?: number;
          games_won?: number;
          terms_guessed?: number;
          favorite_category?: string | null;
        };
        Update: {
          games_played?: number;
          games_won?: number;
          terms_guessed?: number;
          favorite_category?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      next_discriminator: {
        Args: { p_display_name: string };
        Returns: number;
      };
      generate_lobby_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      increment_player_score: {
        Args: { p_player_id: string; p_amount: number };
        Returns: void;
      };
      increment_team_score: {
        Args: { p_team_id: string; p_amount: number };
        Returns: void;
      };
      increment_stat: {
        Args: {
          p_user_id: string;
          p_games_played?: number;
          p_games_won?: number;
          p_terms_guessed?: number;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ── Domain types (cast from Json in DB) ───────────────────

export type LobbyRules = {
  number_of_rounds: number;
  terms_per_turn: number;
  word_budget: number;
  number_of_teams: number;
  categories: string[];
  is_18_plus_mode: boolean;
  clue_master_rotation: "static" | "round" | "term";
  classroom_scoring_mode: "first_correct" | "all_correct";
  ffa_term_rotation: boolean;
};

export type GamePhase =
  | "waiting"
  | "turn_start"
  | "clueing"
  | "correct_guess"
  | "turn_summary"
  | "turn_end"
  | "round_end"
  | "game_over";

export type SlotCell =
  | { kind: "empty" }
  | { kind: "filled"; word: string }
  | { kind: "reroll" };

export type CurrentTerm = {
  term: string;
  category: string;
  word_bank_id: number;
  sprite_ref: string | null;
  current_clue_message_id: string | null;
};

// Convenience row types
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type LobbyRow = Database["public"]["Tables"]["lobbies"]["Row"];
export type LobbyTeamRow = Database["public"]["Tables"]["lobby_teams"]["Row"];
export type LobbyPlayerRow = Database["public"]["Tables"]["lobby_players"]["Row"];
export type GameStateRow = Database["public"]["Tables"]["game_state"]["Row"];
export type StatsRow = Database["public"]["Tables"]["stats"]["Row"];
export type ChatMessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];
export type WordBankRow = Database["public"]["Tables"]["word_bank"]["Row"];
