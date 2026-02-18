import { AuthProvider } from "@/components/auth/auth-provider";
import { TopNav } from "@/components/dashboard/top-nav";
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
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
        {children}
      </main>
      <footer className="py-4 text-center text-[10px] text-muted-foreground/50">
        <p>Designed by TheLevelTeam LLC</p>
        <p>
          Built: #{process.env.NEXT_PUBLIC_BUILD_NUMBER}, Version{" "}
          {process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </footer>
    </AuthProvider>
  );
}
