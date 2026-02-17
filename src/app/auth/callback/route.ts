import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

/**
 * Auto-approve a customer who signed up from a share link.
 * Looks up the project by share token, then updates the user's profile
 * to approved + linked to the project's client.
 */
async function autoApproveShareSignup(
  userId: string,
  shareToken: string
): Promise<void> {
  const admin = getAdminSupabase();

  // Look up the project by share token to get the client_id
  const { data: project } = await admin
    .from("projects")
    .select("client_id")
    .eq("share_token", shareToken)
    .single();

  if (!project) return;

  // Update the profile: approve and link to the project's client
  await admin
    .from("profiles")
    .update({
      status: "approved",
      role: "client",
      client_id: project.client_id,
    })
    .eq("id", userId);
}

/**
 * Extract the share token from a /share/[token] path.
 * Returns null if the path doesn't match.
 */
function extractShareToken(path: string): string | null {
  const match = path.match(/^\/share\/([^/]+)/);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Password recovery flow → send to reset-password page
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // Auto-approve customers signing up from a share link
      const shareToken = extractShareToken(next);
      if (shareToken) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          try {
            await autoApproveShareSignup(user.id, shareToken);
          } catch {
            // Non-blocking: if auto-approve fails, the user still lands
            // on the share page and can be approved manually by an admin.
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
