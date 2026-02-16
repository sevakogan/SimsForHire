import { createSupabaseServer } from "@/lib/supabase-server";
import { getSellers } from "@/lib/actions/sellers";
import type { Seller } from "@/lib/actions/sellers";
import { SellersManager } from "@/components/customizations/sellers-manager";
import type { Profile } from "@/types";
import { isAdminRole } from "@/types";
import { redirect } from "next/navigation";

export default async function CustomizationsPage() {
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
  if (!isAdminRole(typedProfile.role)) redirect("/dashboard");

  let sellers: Seller[];
  try {
    sellers = await getSellers();
  } catch {
    sellers = [];
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-lg font-bold text-foreground sm:text-2xl">
        Customizations
      </h1>

      <SellersManager sellers={sellers} />
    </div>
  );
}
