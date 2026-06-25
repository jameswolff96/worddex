import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const [lobbiesResult, usersResult] = await Promise.all([
    supabase.rpc("cleanup_stale_lobbies"),
    supabase.rpc("cleanup_anon_users"),
  ]);

  if (lobbiesResult.error) console.error("cleanup_stale_lobbies:", lobbiesResult.error.message);
  if (usersResult.error) console.error("cleanup_anon_users:", usersResult.error.message);

  return new Response(
    JSON.stringify({
      anon_users_deleted: usersResult.data ?? 0,
      errors: [lobbiesResult.error?.message, usersResult.error?.message].filter(Boolean),
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
