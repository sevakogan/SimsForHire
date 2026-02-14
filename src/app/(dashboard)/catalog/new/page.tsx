import { createSupabaseServer } from "@/lib/supabase-server";
import { ProductForm } from "@/components/products/product-form";
import { cardStyles } from "@/components/ui/form-styles";
import Link from "next/link";
import type { Profile } from "@/types";
import { isAdminRole } from "@/types";

export default async function NewProductPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/catalog"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Catalog
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Add Product</h1>
      </div>
      <div className={cardStyles.base}>
        <ProductForm isAdmin={admin} />
      </div>
    </div>
  );
}
