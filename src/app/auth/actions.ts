"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateDisplayName } from "@/lib/game/nameGenerator";

export type AuthError = { error: string };

export async function signUp(
  _prev: AuthError | undefined,
  formData: FormData
): Promise<AuthError | undefined> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  let displayName = (formData.get("display_name") as string)?.trim();

  if (!email || !password) return { error: "Email and password are required" };

  if (!displayName) {
    displayName = await generateDisplayName();
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) return { error: error.message };

  redirect("/");
}

export async function signIn(
  _prev: AuthError | undefined,
  formData: FormData
): Promise<AuthError | undefined> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  redirect("/");
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
