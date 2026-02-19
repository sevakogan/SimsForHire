import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { AuthProvider } from "@/components/auth/auth-provider";
import { PortalTopNav } from "@/components/portal/portal-top-nav";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

async function getPortalProfile(): Promise<Profile | null> {
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

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getPortalProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <AuthProvider serverProfile={profile}>
      <div className="min-h-screen bg-gray-50">
        <PortalTopNav />
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
        <footer className="py-4 text-center text-[10px] text-gray-400">
          <p>Designed by TheLevelTeam LLC</p>
          <p>
            Built: #{process.env.NEXT_PUBLIC_BUILD_NUMBER}, Version{" "}
            {process.env.NEXT_PUBLIC_APP_VERSION}
          </p>
        </footer>
      </div>
    </AuthProvider>
  );
}
