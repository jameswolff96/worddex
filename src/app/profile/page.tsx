import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Brandbar } from "@/components/Brandbar";
import { ProfileClient } from "./ProfileClient";
import { pokemonSpriteUrl } from "@/lib/game/sprites";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, email, avatar, created_at")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  const { data: statsRow } = await supabase
    .from("stats")
    .select("games_played, games_won, terms_guessed")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-16">
      <Brandbar />
      <ProfileClient
        displayName={profile.display_name}
        email={profile.email}
        spriteUrl={pokemonSpriteUrl(profile.avatar)}
        currentAvatar={profile.avatar}
        createdAt={profile.created_at}
        stats={{
          gamesPlayed: statsRow?.games_played ?? 0,
          gamesWon: statsRow?.games_won ?? 0,
          termsGuessed: statsRow?.terms_guessed ?? 0,
        }}
      />
    </div>
  );
}
