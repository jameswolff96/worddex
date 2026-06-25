import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Brandbar } from "@/components/Brandbar";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, discriminator, email, created_at")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-16">
      <Brandbar />
      <ProfileClient
        displayName={profile.display_name}
        discriminator={profile.discriminator}
        email={profile.email}
        createdAt={profile.created_at}
      />
    </div>
  );
}
