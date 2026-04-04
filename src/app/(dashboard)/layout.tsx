import { AuthProvider } from "@/components/auth/auth-provider";
import { Sidebar } from "@/components/dashboard/sidebar";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { Profile } from "@/types";

async function getServerProfile(): Promise<Profile | null> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return (data as Profile) ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serverProfile = await getServerProfile();

  return (
    <AuthProvider serverProfile={serverProfile}>
      <div style={{ background: "#F5F5F7", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ marginLeft: 240, minHeight: "100vh", padding: "48px 56px" }}>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
