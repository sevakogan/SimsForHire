import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getProductById } from "@/lib/actions/products";
import { ProductForm } from "@/components/products/product-form";
import { cardStyles } from "@/components/ui/form-styles";
import Link from "next/link";
import type { Profile } from "@/types";
import { isAdminRole } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: Props) {
  const { id } = await params;
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

  const service = await getProductById(id);
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link
          href="/customizations/services"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          &larr; Services
        </Link>
        <h1 className="text-lg font-semibold text-foreground">
          {service.name || "Edit Service"}
        </h1>
      </div>
      <div className={cardStyles.compact}>
        <ProductForm
          product={service}
          isAdmin={admin}
          category="service"
          basePath="/customizations/services"
        />
      </div>
    </div>
  );
}
