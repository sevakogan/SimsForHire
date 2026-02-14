"use server";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function uploadAvatar(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get("file") as File | null;
  if (!file) return { url: null, error: "No file provided" };

  if (!ALLOWED_TYPES.has(file.type)) {
    return { url: null, error: "Only JPEG, PNG, WebP, and GIF images are allowed" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { url: null, error: "Image must be under 2MB" };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { url: null, error: "Not authenticated" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `avatars/${user.id}/avatar-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const serviceClient = getServiceClient();

  // Upload avatar
  const { error: uploadError } = await serviceClient.storage
    .from("item-images")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) return { url: null, error: uploadError.message };

  const {
    data: { publicUrl },
  } = serviceClient.storage.from("item-images").getPublicUrl(fileName);

  // Update profile with new avatar URL
  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (profileError) return { url: null, error: profileError.message };

  return { url: publicUrl, error: null };
}
