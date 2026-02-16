import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { cardStyles } from "@/components/ui/form-styles";
import type { Profile } from "@/types";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
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

  // Detect if user signed up with email/password (has an email identity)
  const hasPassword = user.app_metadata?.providers?.includes("email") ?? false;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-lg font-bold text-foreground sm:text-xl">
        My Profile
      </h1>

      <div className={cardStyles.base}>
        <ProfileForm profile={typedProfile} hasPassword={hasPassword} />
      </div>

      {/* Read-only account info */}
      <div className={`${cardStyles.base} !p-4`}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <InfoField label="Role" value={typedProfile.role} />
          <InfoField label="Status" value={typedProfile.status} />
          <InfoField
            label="Member Since"
            value={new Date(typedProfile.created_at).toLocaleDateString()}
          />
          <InfoField
            label="Auth Method"
            value={hasPassword ? "Email & Password" : "Google"}
          />
        </div>
      </div>

      {/* Quick links */}
      <div className={`${cardStyles.base} !p-4`}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tools
        </h2>
        <Link
          href="/customizations/products"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <div>
            <p>Product Catalog</p>
            <p className="text-xs text-muted-foreground">Manage your product inventory</p>
          </div>
          <svg className="ml-auto h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm capitalize text-foreground">{value}</p>
    </div>
  );
}
