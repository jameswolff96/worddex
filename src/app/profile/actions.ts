"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { generateDisplayName } from "@/lib/game/nameGenerator";
import { filterContent } from "@/lib/game/contentFilter";

export type ProfileError = { error: string };

export async function updateDisplayName(
  _prev: ProfileError | undefined,
  formData: FormData
): Promise<ProfileError | undefined> {
  const raw = (formData.get("display_name") as string)?.trim();
  const displayName = raw || (await generateDisplayName());

  if (displayName.length > 32) return { error: "Display name must be 32 characters or fewer" };

  const contentCheck = filterContent(displayName, false);
  if (contentCheck.blocked) return { error: contentCheck.reason };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: disc, error: discErr } = await supabase.rpc("next_discriminator", {
    p_display_name: displayName,
  });
  if (discErr) return { error: discErr.message };

  const { error } = await supabase
    .from("users")
    .update({ display_name: displayName, discriminator: (disc as unknown) as number })
    .eq("id", user.id);

  if (error) return { error: error.message };
}

export async function updateAvatar(
  dexNumber: string
): Promise<ProfileError | undefined> {
  const num = parseInt(dexNumber, 10);
  if (isNaN(num) || num < 1 || num > 1025) return { error: "Invalid Pokémon" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("users")
    .update({ avatar: dexNumber })
    .eq("id", user.id);

  if (error) return { error: error.message };
}

export type DataExport = {
  exported_at: string;
  profile: Record<string, unknown>;
  stats: Record<string, unknown> | null;
  games: Record<string, unknown>[];
  chat_messages: Record<string, unknown>[];
};

export async function exportMyData(): Promise<{ data: DataExport } | ProfileError> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: cooldownRow } = await supabase
    .from("users")
    .select("last_data_export_at")
    .eq("id", user.id)
    .single();

  if (cooldownRow?.last_data_export_at) {
    const elapsed = Date.now() - new Date(cooldownRow.last_data_export_at).getTime();
    const remaining = 24 * 60 * 60 * 1000 - elapsed;
    if (remaining > 0) {
      const hours = Math.ceil(remaining / (60 * 60 * 1000));
      return { error: `You can request a data export once every 24 hours. Try again in ${hours}h.` };
    }
  }

  const [profileRes, statsRes, gamesRes, playerIdsRes] = await Promise.all([
    supabase
      .from("users")
      .select("display_name, discriminator, email, avatar, created_at")
      .eq("id", user.id)
      .single(),

    supabase
      .from("stats")
      .select("games_played, games_won, terms_guessed, favorite_category")
      .eq("user_id", user.id)
      .single(),

    supabase
      .from("lobby_players")
      .select("score, join_order, lobbies(code, mode, status, created_at)")
      .eq("user_id", user.id),

    supabase
      .from("lobby_players")
      .select("id")
      .eq("user_id", user.id),
  ]);

  // chat_messages.sender_player_id → lobby_players.id, so filter by player IDs
  const playerIds = (playerIdsRes.data ?? []).map((r) => r.id);
  const chatRes = playerIds.length > 0
    ? await supabase
        .from("chat_messages")
        .select("content, kind, created_at, lobbies(code)")
        .in("sender_player_id", playerIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  await supabase
    .from("users")
    .update({ last_data_export_at: new Date().toISOString() })
    .eq("id", user.id);

  return {
    data: {
      exported_at: new Date().toISOString(),
      profile: (profileRes.data ?? {}) as Record<string, unknown>,
      stats: (statsRes.data ?? null) as Record<string, unknown> | null,
      games: (gamesRes.data ?? []) as Record<string, unknown>[],
      chat_messages: (chatRes.data ?? []) as Record<string, unknown>[],
    },
  };
}

export async function deleteAccount(
  _prev: ProfileError | undefined,
  _formData: FormData
): Promise<ProfileError | undefined> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return { error: "Account deletion is not configured" };

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  redirect("/auth/signup");
}
