"use server";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

// Service-role client for storage uploads (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function uploadImage(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get("file") as File | null;
  if (!file) return { url: null, error: "No file provided" };

  // Verify user is authenticated via session
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { url: null, error: "Not authenticated" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload using service-role client to bypass storage RLS
  const serviceClient = getServiceClient();
  const { error } = await serviceClient.storage
    .from("item-images")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) return { url: null, error: error.message };

  const {
    data: { publicUrl },
  } = serviceClient.storage.from("item-images").getPublicUrl(fileName);

  return { url: publicUrl, error: null };
}
