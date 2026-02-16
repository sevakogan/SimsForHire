import { createSupabaseServer } from "@/lib/supabase-server";
import { CustomizationsSidebar } from "@/components/customizations/customizations-sidebar";
import type { Profile } from "@/types";
import { isAdminRole } from "@/types";
import { redirect } from "next/navigation";

export default async function CustomizationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const typedProfile = profile as Profile;
  const admin = isAdminRole(typedProfile.role);

  return (
    <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-6">
      <CustomizationsSidebar isAdmin={admin}>
        {children}
      </CustomizationsSidebar>
    </div>
  );
}
