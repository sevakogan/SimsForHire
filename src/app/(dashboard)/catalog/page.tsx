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

  console.log(
    "[CatalogPage] admin:",
    admin,
    "product count:",
    products.length,
    "sample:",
    products.slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      image_url: p.image_url,
    }))
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">Products</h1>
      <ProductsView products={products} isAdmin={admin} />
    </div>
  );
}
