"use server";

import { getAdminSupabase } from "@/lib/supabase-admin";
import type { ContactMessage } from "@/types";

/**
 * Public — submit a contact message from the share page.
 * Validates share token, rate-limits by project.
 */
export async function submitContactMessage(
  shareToken: string,
  input: { senderName: string; senderEmail: string; message: string }
): Promise<{ error: string | null }> {
  const { senderName, senderEmail, message } = input;

  // Validate fields
  if (!senderName.trim()) return { error: "Name is required." };
  if (!senderEmail.trim()) return { error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
    return { error: "Please enter a valid email address." };
  }
  if (!message.trim()) return { error: "Message is required." };
  if (message.trim().length > 5000) return { error: "Message is too long (max 5000 characters)." };

  const admin = getAdminSupabase();

  // Validate share token → get project
  const { data: project, error: projErr } = await admin
    .from("projects")
    .select("id")
    .eq("share_token", shareToken)
    .single();

  if (projErr || !project) {
    return { error: "Invalid share link." };
  }

  // Rate limit: max 5 messages per hour per project
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await admin
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id)
    .gte("created_at", oneHourAgo);

  if (!countErr && (count ?? 0) >= 5) {
    return { error: "Too many messages sent recently. Please try again later." };
  }

  // Insert message
  const { error } = await admin.from("contact_messages").insert({
    project_id: project.id,
    sender_name: senderName.trim(),
    sender_email: senderEmail.trim(),
    message: message.trim(),
  });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Authenticated — get contact messages for a project.
 */
export async function getContactMessages(
  projectId: string
): Promise<ContactMessage[]> {
  const admin = getAdminSupabase();

  const { data, error } = await admin
    .from("contact_messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getContactMessages]", error.message);
    return [];
  }

  return (data ?? []) as ContactMessage[];
}
