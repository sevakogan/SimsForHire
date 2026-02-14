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

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">
        My Profile
      </h1>

      <div className={`${cardStyles.base} !p-4 sm:!p-6`}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Email
            </p>
            <p className="text-sm text-foreground">{typedProfile.email}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Role
            </p>
            <p className="text-sm font-medium capitalize text-foreground">
              {typedProfile.role}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Status
            </p>
            <p className="text-sm capitalize text-foreground">
              {typedProfile.status}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Member Since
            </p>
            <p className="text-sm text-foreground">
              {new Date(typedProfile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className={cardStyles.base}>
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Edit Profile
        </h2>
        <ProfileForm profile={typedProfile} />
      </div>
    </div>
  );
}
