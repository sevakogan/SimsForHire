"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { sendCAPIEvent } from "@/lib/meta-capi";
import type { Lead, LeadStatus, LeadCampaign } from "@/types";

export async function getLeads(): Promise<Lead[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Lead[];
}

export async function getArchivedLeads(): Promise<Lead[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Lead[];
}

export interface LeadStats {
  total: number;
  newCount: number;
  thisWeek: number;
}

export async function getLeadStats(): Promise<LeadStats> {
  const supabase = getAdminSupabase();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [totalRes, newRes, weekRes] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new").is("archived_at", null),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", oneWeekAgo.toISOString()).is("archived_at", null),
  ]);

  return {
    total: totalRes.count ?? 0,
    newCount: newRes.count ?? 0,
    thisWeek: weekRes.count ?? 0,
  };
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // If marked lost → stop current campaign, start win-back
  if (status === "lost") {
    await handleLostLeadCampaign(id);
  }

  // If marked booked → stop campaign + fire Meta Purchase event
  if (status === "booked") {
    await stopLeadCampaigns(id);
    await fireMetaPurchaseEvent(id).catch((err) =>
      console.error("[Meta Purchase] Failed:", err),
    );
  }

  revalidatePath("/leads");
}

/**
 * Sends a Purchase CAPI event to Meta when a lead converts to a booking.
 * This is the signal Meta's optimization algorithm actually cares about —
 * "this person paid us" vs "this person filled out a form".
 *
 * Uses `estimated_value_cents` from the lead row as the monetary value.
 * Sales can edit that column directly in Supabase if the actual deal differs.
 */
async function fireMetaPurchaseEvent(leadId: string): Promise<void> {
  const supabase = getAdminSupabase();
  const { data: lead, error } = await supabase
    .from("leads")
    .select("email, phone, name, estimated_value_cents, source, event_type")
    .eq("id", leadId)
    .single();

  if (error || !lead) {
    console.error("[Meta Purchase] Could not load lead:", error?.message);
    return;
  }

  const nameParts = (lead.name ?? "").trim().split(/\s+/);
  const firstName = nameParts[0] || undefined;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

  await sendCAPIEvent({
    eventName: "Purchase",
    eventSourceUrl: "https://simsforhire.com",
    eventId: `booking-${leadId}`, // deterministic — prevents double-count if called twice
    userData: {
      email: lead.email,
      phone: lead.phone ?? undefined,
      firstName,
      lastName,
    },
    customData: {
      content_category: lead.event_type ?? lead.source,
      content_name: "Lead Booked",
    },
    value: lead.estimated_value_cents != null ? lead.estimated_value_cents / 100 : undefined,
    currency: "USD",
  });
}

export async function archiveLead(id: string): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("leads")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Stop any active campaigns
  await stopLeadCampaigns(id);

  revalidatePath("/leads");
}

export async function unarchiveLead(id: string): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("leads")
    .update({ archived_at: null })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/leads");
}

export async function deleteLead(id: string): Promise<void> {
  const supabase = getAdminSupabase();

  // Delete campaign enrollments first
  await supabase.from("lead_campaigns").delete().eq("lead_id", id);

  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
}

// ─── Campaign helpers ───

export async function getLeadCampaignStatus(leadId: string): Promise<LeadCampaign | null> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("lead_campaigns")
    .select(`
      *,
      campaign:email_campaigns(*)
    `)
    .eq("lead_id", leadId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    // Return most recent stopped/completed
    const { data: last } = await supabase
      .from("lead_campaigns")
      .select(`*, campaign:email_campaigns(*)`)
      .eq("lead_id", leadId)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (!last) return null;

    // Get total steps for this campaign
    const { count } = await supabase
      .from("campaign_steps")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", last.campaign_id)
      .eq("is_active", true);

    return { ...last, total_steps: count ?? 0 } as LeadCampaign;
  }

  const { count } = await supabase
    .from("campaign_steps")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", data.campaign_id)
    .eq("is_active", true);

  return { ...data, total_steps: count ?? 0 } as LeadCampaign;
}

export async function getLeadCampaignStatuses(leadIds: string[]): Promise<Map<string, LeadCampaign>> {
  if (leadIds.length === 0) return new Map();

  const supabase = getAdminSupabase();

  // Get latest enrollment per lead (prefer active)
  const { data } = await supabase
    .from("lead_campaigns")
    .select(`*, campaign:email_campaigns(*)`)
    .in("lead_id", leadIds)
    .order("started_at", { ascending: false });

  if (!data) return new Map();

  // Get all campaigns' step counts
  const campaignIds = [...new Set(data.map((d) => d.campaign_id))];
  const stepCounts = new Map<string, number>();
  if (campaignIds.length > 0) {
    const { data: steps } = await supabase
      .from("campaign_steps")
      .select("campaign_id")
      .in("campaign_id", campaignIds)
      .eq("is_active", true);
    for (const s of steps ?? []) {
      stepCounts.set(s.campaign_id, (stepCounts.get(s.campaign_id) ?? 0) + 1);
    }
  }

  // Build map: one entry per lead (prefer active, else most recent)
  const result = new Map<string, LeadCampaign>();
  for (const row of data) {
    const existing = result.get(row.lead_id);
    if (!existing || (row.status === "active" && existing.status !== "active")) {
      result.set(row.lead_id, {
        ...row,
        total_steps: stepCounts.get(row.campaign_id) ?? 0,
      } as LeadCampaign);
    }
  }

  return result;
}

export async function startLeadCampaign(leadId: string, campaignType: string = "welcome_nurture"): Promise<void> {
  const supabase = getAdminSupabase();

  // Find campaign by type
  const { data: campaign } = await supabase
    .from("email_campaigns")
    .select("id")
    .eq("type", campaignType)
    .single();

  if (!campaign) throw new Error(`Campaign type '${campaignType}' not found`);

  // Get first step's delay
  const { data: firstStep } = await supabase
    .from("campaign_steps")
    .select("delay_hours")
    .eq("campaign_id", campaign.id)
    .eq("step_number", 1)
    .eq("is_active", true)
    .single();

  const nextSendAt = firstStep?.delay_hours === 0
    ? new Date().toISOString()
    : new Date(Date.now() + (firstStep?.delay_hours ?? 0) * 3600 * 1000).toISOString();

  // Upsert enrollment (resume from step 1)
  const { error } = await supabase
    .from("lead_campaigns")
    .upsert(
      {
        lead_id: leadId,
        campaign_id: campaign.id,
        current_step: 1,
        status: "active",
        started_at: new Date().toISOString(),
        next_send_at: nextSendAt,
        completed_at: null,
      },
      { onConflict: "lead_id,campaign_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath("/leads");
}

export async function stopLeadCampaigns(leadId: string): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("lead_campaigns")
    .update({ status: "stopped" })
    .eq("lead_id", leadId)
    .eq("status", "active");

  if (error) throw new Error(error.message);
  revalidatePath("/leads");
}

async function handleLostLeadCampaign(leadId: string): Promise<void> {
  // Stop all active campaigns
  await stopLeadCampaigns(leadId);
  // Start win-back campaign
  await startLeadCampaign(leadId, "win_back");
}
