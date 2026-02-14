import { createSupabaseServer } from "@/lib/supabase-server";
import { getProducts, getProductsForClient } from "@/lib/actions/products";
import { ProductsTable } from "@/components/products/products-table";
import { QuickAddProduct } from "@/components/products/quick-add-product";
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

      {admin && <QuickAddProduct isAdmin={admin} />}

      <ProductsTable products={products} isAdmin={admin} />
    </div>
  );
}
