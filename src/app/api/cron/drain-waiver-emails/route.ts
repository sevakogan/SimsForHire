import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { buildWaiverEmail } from "@/lib/email-template";
import { generateWaiverPdf } from "@/lib/waiver-pdf";
import { Resend } from "resend";

export const maxDuration = 300;

// Stay comfortably under Resend's daily limit per run.
// Override via env var if you're on a higher-tier plan.
const BATCH_SIZE = Number(process.env.EMAIL_DRAINER_BATCH_SIZE ?? 90);

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const supabase = getAdminSupabase();

  // Load racers whose email hasn't been sent yet
  const { data: pending, error: fetchError } = await supabase
    .from("racers")
    .select(
      "id,name,email,waiver_version,waiver_accepted_at,waiver_accepted_ip,waiver_accepted_user_agent,signature_data_url,event_id"
    )
    .is("email_sent_at", null)
    .not("email", "is", null)
    .not("waiver_version", "is", null)
    .order("waiver_accepted_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, message: "Queue empty" });
  }

  // Load event + config + waiver body for all unique events in one shot
  const eventIds = Array.from(new Set(pending.map((r) => r.event_id as string)));
  const [{ data: events }, { data: configs }] = await Promise.all([
    supabase.from("live_events").select("id,name,slug").in("id", eventIds),
    supabase.from("event_config").select("event_id,dealer_name").in("event_id", eventIds),
  ]);

  const eventMap = new Map<string, { name: string; slug: string }>();
  for (const e of events ?? []) {
    eventMap.set(e.id as string, { name: e.name as string, slug: e.slug as string });
  }
  const dealerMap = new Map<string, string>();
  for (const c of configs ?? []) {
    dealerMap.set(c.event_id as string, (c.dealer_name as string | null) ?? "Sims For Hire");
  }

  // Load waiver bodies for all needed (event_id, version) pairs
  const waiverKeys = Array.from(
    new Map(
      pending.map((r) => [`${r.event_id}:${r.waiver_version}`, { event_id: r.event_id as string, version: r.waiver_version as number }])
    ).values()
  );
  const waiverBodies = new Map<string, string>();
  await Promise.all(
    waiverKeys.map(async ({ event_id, version }) => {
      const { data } = await supabase
        .from("event_waiver_versions")
        .select("body")
        .eq("event_id", event_id)
        .eq("version", version)
        .single();
      if (data?.body) waiverBodies.set(`${event_id}:${version}`, data.body as string);
    })
  );

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL ?? "SimsForHire <hello@simsforhire.com>";

  let sent = 0;
  let failed = 0;

  for (const racer of pending) {
    const email = racer.email as string;
    const eventId = racer.event_id as string;
    const event = eventMap.get(eventId);
    if (!event) { failed++; continue; }

    const dealerName = dealerMap.get(eventId) ?? "Sims For Hire";
    const waiverBody = waiverBodies.get(`${eventId}:${racer.waiver_version}`) ?? "";
    const signedAt = racer.waiver_accepted_at ? new Date(racer.waiver_accepted_at as string) : new Date();

    try {
      const [html, pdfBuffer] = await Promise.all([
        Promise.resolve(buildWaiverEmail(racer.name as string, event.name, dealerName)),
        generateWaiverPdf({
          name: racer.name as string,
          email,
          signedAt,
          signedIp: (racer.waiver_accepted_ip as string | null) ?? null,
          signedUserAgent: (racer.waiver_accepted_user_agent as string | null) ?? null,
          waiverVersion: racer.waiver_version as number,
          waiverText: waiverBody,
          signatureDataUrl: (racer.signature_data_url as string | null) ?? null,
          dealerName,
          eventName: event.name,
          eventSlug: event.slug,
        }),
      ]);

      const { error: sendError } = await resend.emails.send({
        from,
        to: email,
        subject: `Your signed waiver — ${event.name}`,
        html,
        attachments: [
          {
            filename: `Waiver-${event.slug}.pdf`,
            content: pdfBuffer.toString("base64"),
          },
        ],
      });

      if (sendError) throw new Error(sendError.message);

      await supabase
        .from("racers")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", racer.id);

      sent++;
    } catch (err) {
      console.error(`[drain-waiver-emails] failed for racer ${racer.id} (${email}):`, err);
      failed++;
    }
  }

  console.log(`[drain-waiver-emails] sent=${sent} failed=${failed} remaining=check-next-run`);
  return NextResponse.json({ sent, failed, processed: pending.length });
}
