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
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link
          href="/customizations/products"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          &larr; Products
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Add Product</h1>
      </div>
      <div className={cardStyles.compact}>
        <ProductForm isAdmin={admin} />
      </div>
    </div>
  );
}
