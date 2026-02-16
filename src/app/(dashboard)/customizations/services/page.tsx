import { createSupabaseServer } from "@/lib/supabase-server";
import { getProducts, getProductsForClient } from "@/lib/actions/products";
import { ProductsView } from "@/components/products/products-view";
import type { Profile } from "@/types";
import { isAdminRole } from "@/types";

export default async function CustomizationsServicesPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const typedProfile = profile as Profile;
  const admin = isAdminRole(typedProfile.role);

  const services = admin
    ? await getProducts("service")
    : await getProductsForClient("service");

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">Services</h1>
      <ProductsView
        products={services}
        isAdmin={admin}
        basePath="/customizations/services"
      />
    </div>
  );
}
