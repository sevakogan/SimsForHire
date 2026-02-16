import { createSupabaseServer } from "@/lib/supabase-server";
import { getProductTypes } from "@/lib/actions/product-types";
import type { ProductType } from "@/lib/actions/product-types";
import { TypesManager } from "@/components/customizations/types-manager";
import type { Profile } from "@/types";
import { isAdminRole } from "@/types";
import { redirect } from "next/navigation";

export default async function TypesPage() {
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
  if (!isAdminRole(typedProfile.role)) redirect("/customizations/products");

  let types: ProductType[];
  try {
    types = await getProductTypes();
  } catch {
    types = [];
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-lg font-bold text-foreground sm:text-2xl">
        Product Types
      </h1>
      <TypesManager types={types} />
    </div>
  );
}
