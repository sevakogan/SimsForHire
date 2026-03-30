import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { CAMPAIGNS } from "@/lib/campaign-seed";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminSupabase();
  const results: string[] = [];

  for (const campaign of CAMPAIGNS) {
    // Upsert campaign
    const { data: existing } = await supabase
      .from("email_campaigns")
      .select("id")
      .eq("type", campaign.type)
      .single();

    let campaignId: string;

    if (existing) {
      campaignId = existing.id;
      await supabase
        .from("email_campaigns")
        .update({ name: campaign.name, description: campaign.description, updated_at: new Date().toISOString() })
        .eq("id", campaignId);
      results.push(`Updated: ${campaign.name}`);
    } else {
      const { data: created, error } = await supabase
        .from("email_campaigns")
        .insert({ name: campaign.name, type: campaign.type, description: campaign.description })
        .select("id")
        .single();
      if (error) {
        results.push(`Error creating ${campaign.name}: ${error.message}`);
        continue;
      }
      campaignId = created.id;
      results.push(`Created: ${campaign.name}`);
    }

    // Upsert steps
    for (const step of campaign.steps) {
      const { data: existingStep } = await supabase
        .from("campaign_steps")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("step_number", step.step_number)
        .single();

      if (existingStep) {
        await supabase
          .from("campaign_steps")
          .update({ ...step, updated_at: new Date().toISOString() })
          .eq("id", existingStep.id);
      } else {
        await supabase.from("campaign_steps").insert({ campaign_id: campaignId, ...step });
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
