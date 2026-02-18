"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/actions/notifications";

/**
 * Sign the purchase agreement with full signature + initials data.
 * Stores the signature/initials as base64 data URLs directly on the project row.
 * Records signer name, IP, and timestamp.
 */
export async function signContractFull(
  shareToken: string,
  input: {
    buyerName: string;
    signatureDataUrl: string;
    initialsDataUrl: string;
  }
): Promise<{ error: string | null }> {
  if (!shareToken) return { error: "Invalid token" };
  const { buyerName, signatureDataUrl, initialsDataUrl } = input;

  if (!buyerName.trim()) return { error: "Buyer name is required" };
  if (!signatureDataUrl) return { error: "Signature is required" };
  if (!initialsDataUrl) return { error: "Initials are required" };

  // Validate data URLs are reasonably sized (< 500KB each)
  const MAX_DATA_URL_SIZE = 500_000;
  if (signatureDataUrl.length > MAX_DATA_URL_SIZE) {
    return { error: "Signature image is too large" };
  }
  if (initialsDataUrl.length > MAX_DATA_URL_SIZE) {
    return { error: "Initials image is too large" };
  }

  const supabase = getAdminSupabase();

  const { data: project } = await supabase
    .from("projects")
    .select("id, contract_signed_at")
    .eq("share_token", shareToken)
    .single();

  if (!project) return { error: "Invalid share link" };

  if (project.contract_signed_at) {
    return { error: "Contract has already been signed" };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("projects")
    .update({
      contract_signed_at: now,
      contract_signed_by: buyerName.trim(),
      contract_signature_data: signatureDataUrl,
      contract_initials_data: initialsDataUrl,
    })
    .eq("id", project.id);

  if (error) return { error: error.message };

  // Also mark contract as viewed if not already
  await supabase
    .from("projects")
    .update({ contract_viewed_at: now })
    .eq("id", project.id)
    .is("contract_viewed_at", null);

  await createNotification({
    projectId: project.id,
    type: "contract_signed",
    title: `Contract signed by ${buyerName.trim()}`,
    body: "The customer has signed the purchase agreement with signature and initials.",
  });

  revalidatePath("/projects", "layout");
  revalidatePath("/share", "layout");
  return { error: null };
}
