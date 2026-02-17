import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { getPaymentSettings } from "@/lib/actions/payment-settings";
import { PaymentSetupForm } from "./payment-setup-form";
import type { Profile } from "@/types";
import { isAdminRole } from "@/types";

export default async function PaymentSetupPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isAdminRole((profile as Profile).role)) {
    redirect("/dashboard");
  }

  const settings = await getPaymentSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground sm:text-2xl">
          Payment Setup
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your Stripe account to accept payments from clients.
        </p>
      </div>
      <PaymentSetupForm settings={settings} />
    </div>
  );
}
