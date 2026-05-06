import { getAdminSupabase } from "@/lib/supabase-admin";

export const maxDuration = 10;

export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await getAdminSupabase()
    .from("live_events")
    .select("id")
    .limit(1);

  if (error) {
    console.error("[keepalive] DB ping failed:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  console.log("[keepalive] DB ping OK —", new Date().toISOString());
  return Response.json({ ok: true });
}
