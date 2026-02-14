import { createSupabaseServer } from "@/lib/supabase-server";
import { getProducts, getProductsForClient } from "@/lib/actions/products";
import { ProductsView } from "@/components/products/products-view";
import type { Profile } from "@/types";
import { isAdminRole } from "@/types";

export default async function CatalogPage() {
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

  const products = admin
    ? await getProducts()
    : await getProductsForClient();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Products</h1>
      <ProductsView products={products} isAdmin={admin} />
    </div>
  );
}
