import { AuthProvider } from "@/components/auth/auth-provider";
import { TopNav } from "@/components/dashboard/top-nav";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { Profile } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch profile server-side (bypasses client RLS timing issues)
  let serverProfile: Profile | null = null;
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      serverProfile = data as Profile | null;
    }
  } catch {
    // Ignore — profile will be fetched client-side as fallback
  }

  return (
    <AuthProvider serverProfile={serverProfile}>
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">{children}</main>
    </AuthProvider>
  );
}
