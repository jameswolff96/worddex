"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { generateDisplayName } from "@/lib/game/nameGenerator";

export type ProfileError = { error: string };

export async function updateDisplayName(
  _prev: ProfileError | undefined,
  formData: FormData
): Promise<ProfileError | undefined> {
  const raw = (formData.get("display_name") as string)?.trim();
  const displayName = raw || (await generateDisplayName());

  if (displayName.length > 32) return { error: "Display name must be 32 characters or fewer" };

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
