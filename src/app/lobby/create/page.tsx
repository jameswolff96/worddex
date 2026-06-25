import { createClient } from "@/lib/supabase/server";
import { Brandbar } from "@/components/Brandbar";
import { CreateLobbyForm } from "./CreateLobbyForm";

export default async function CreateLobbyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-16">
      <Brandbar />
      <CreateLobbyForm isGuest={!user} />
    </div>
  );
}
