import { redirect } from "next/navigation";
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
