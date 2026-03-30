"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/lib/supabase-admin";
import type { EmailCampaign, CampaignStep } from "@/types";

export interface CampaignWithSteps extends EmailCampaign {
  steps: CampaignStep[];
  enrollment_count: number;
}

export async function getCampaigns(): Promise<CampaignWithSteps[]> {
  const supabase = getAdminSupabase();

  const { data: campaigns, error } = await supabase
    .from("email_campaigns")
    .select("*")
    .order("created_at");

  // Tables may not exist yet — return empty until migration is run
  if (error) return [];
  if (!campaigns || campaigns.length === 0) return [];

  const { data: steps } = await supabase
    .from("campaign_steps")
    .select("*")
    .in("campaign_id", campaigns.map((c) => c.id))
    .order("step_number");

  const { data: enrollments } = await supabase
    .from("lead_campaigns")
    .select("campaign_id")
    .eq("status", "active");

  const stepsByCampaign = new Map<string, CampaignStep[]>();
  for (const step of steps ?? []) {
    const list = stepsByCampaign.get(step.campaign_id) ?? [];
    list.push(step as CampaignStep);
    stepsByCampaign.set(step.campaign_id, list);
  }

  const enrollmentCounts = new Map<string, number>();
  for (const e of enrollments ?? []) {
    enrollmentCounts.set(e.campaign_id, (enrollmentCounts.get(e.campaign_id) ?? 0) + 1);
  }

  return campaigns.map((c) => ({
    ...c,
    steps: stepsByCampaign.get(c.id) ?? [],
    enrollment_count: enrollmentCounts.get(c.id) ?? 0,
  } as CampaignWithSteps));
}

export async function updateCampaignStep(
  stepId: string,
  data: { subject?: string; body_html?: string; delay_hours?: number; is_active?: boolean }
): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("campaign_steps")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", stepId);

  if (error) throw new Error(error.message);
  revalidatePath("/marketing");
}

export async function deleteCampaignStep(stepId: string): Promise<void> {
  const supabase = getAdminSupabase();

  // Get step info to renumber siblings
  const { data: step } = await supabase
    .from("campaign_steps")
    .select("campaign_id, step_number")
    .eq("id", stepId)
    .single();

  if (!step) return;

  await supabase.from("campaign_steps").delete().eq("id", stepId);

  // Renumber subsequent steps
  const { data: laterSteps } = await supabase
    .from("campaign_steps")
    .select("id, step_number")
    .eq("campaign_id", step.campaign_id)
    .gt("step_number", step.step_number)
    .order("step_number");

  for (const s of laterSteps ?? []) {
    await supabase
      .from("campaign_steps")
      .update({ step_number: s.step_number - 1 })
      .eq("id", s.id);
  }

  revalidatePath("/marketing");
}

export async function addCampaignStep(
  campaignId: string,
  data: { subject: string; body_html: string; delay_hours: number; channel?: string }
): Promise<void> {
  const supabase = getAdminSupabase();

  const { count } = await supabase
    .from("campaign_steps")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  const { error } = await supabase.from("campaign_steps").insert({
    campaign_id: campaignId,
    step_number: (count ?? 0) + 1,
    channel: data.channel ?? "email",
    subject: data.subject,
    body_html: data.body_html,
    delay_hours: data.delay_hours,
    is_active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/marketing");
}

export async function reorderCampaignStep(stepId: string, direction: "up" | "down"): Promise<void> {
  const supabase = getAdminSupabase();

  const { data: step } = await supabase
    .from("campaign_steps")
    .select("campaign_id, step_number")
    .eq("id", stepId)
    .single();

  if (!step) return;

  const targetNumber = direction === "up" ? step.step_number - 1 : step.step_number + 1;
  if (targetNumber < 1) return;

  const { data: sibling } = await supabase
    .from("campaign_steps")
    .select("id")
    .eq("campaign_id", step.campaign_id)
    .eq("step_number", targetNumber)
    .single();

  if (!sibling) return;

  // Swap step numbers
  await supabase.from("campaign_steps").update({ step_number: targetNumber }).eq("id", stepId);
  await supabase.from("campaign_steps").update({ step_number: step.step_number }).eq("id", sibling.id);

  revalidatePath("/marketing");
}
