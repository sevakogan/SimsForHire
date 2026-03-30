import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { sendEmail } from "@/lib/email-sender";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  // Find all active enrollments due to send
  const { data: due, error } = await supabase
    .from("lead_campaigns")
    .select("*, campaign:email_campaigns(id, name, type)")
    .eq("status", "active")
    .lte("next_send_at", now)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = { sent: 0, skipped: 0, failed: 0, completed: 0 };

  for (const enrollment of due ?? []) {
    try {
      // Get the current step
      const { data: step } = await supabase
        .from("campaign_steps")
        .select("*")
        .eq("campaign_id", enrollment.campaign_id)
        .eq("step_number", enrollment.current_step)
        .single();

      if (!step) {
        // No step found — mark complete
        await supabase
          .from("lead_campaigns")
          .update({ status: "completed", completed_at: now })
          .eq("id", enrollment.id);
        results.completed++;
        continue;
      }

      // Skip inactive steps and SMS (not implemented yet)
      if (!step.is_active || step.channel === "sms") {
        results.skipped++;
      } else {
        // Get lead info
        const { data: lead } = await supabase
          .from("leads")
          .select("email, name")
          .eq("id", enrollment.lead_id)
          .single();

        if (!lead) {
          results.skipped++;
        } else {
          await sendEmail({
            to: lead.email,
            subject: step.subject ?? "A message from SimsForHire",
            bodyHtml: step.body_html,
            leadName: lead.name,
          });
          results.sent++;
        }
      }

      // Advance to next step
      const { data: nextStep } = await supabase
        .from("campaign_steps")
        .select("step_number, delay_hours")
        .eq("campaign_id", enrollment.campaign_id)
        .eq("step_number", enrollment.current_step + 1)
        .single();

      if (nextStep) {
        const nextSendAt = new Date(
          Date.now() + nextStep.delay_hours * 3600 * 1000
        ).toISOString();

        await supabase
          .from("lead_campaigns")
          .update({
            current_step: nextStep.step_number,
            next_send_at: nextSendAt,
          })
          .eq("id", enrollment.id);
      } else {
        // All steps done
        await supabase
          .from("lead_campaigns")
          .update({ status: "completed", completed_at: now })
          .eq("id", enrollment.id);
        results.completed++;
      }
    } catch (err) {
      results.failed++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
