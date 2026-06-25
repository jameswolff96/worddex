import { createClient } from "@/lib/supabase/server";
import { Brandbar } from "@/components/Brandbar";
import { CreateLobbyForm } from "./CreateLobbyForm";

export default async function CreateLobbyPage() {
  const supabase = await createClient();
  const [{ data: { user } }, { data: categoryRows }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("word_bank").select("category").eq("is_active", true),
  ]);

  const categories = [...new Set((categoryRows ?? []).map((r) => r.category))].sort();

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-16">
      <Brandbar />
      <CreateLobbyForm isGuest={!user} categories={categories} />
    </div>
  );
}
