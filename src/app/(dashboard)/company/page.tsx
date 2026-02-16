import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getCompanyInfo } from "@/lib/actions/company-info";
import { CompanyInfoForm } from "@/components/company/company-info-form";
import type { Profile } from "@/types";
import { isAdminRole } from "@/types";

export default async function CompanyInfoPage() {
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

  if (!profile || !isAdminRole((profile as Profile).role)) {
    redirect("/dashboard");
  }

  const companyInfo = await getCompanyInfo();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground sm:text-2xl">
          Company Info
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your company details shown on invoices and the customer portal.
        </p>
      </div>

      <CompanyInfoForm info={companyInfo} />
    </div>
  );
}
