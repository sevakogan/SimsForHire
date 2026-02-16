import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getUnreadNotifications, getTotalUnreadCount } from "@/lib/actions/notifications";
import type { Profile } from "@/types";
import { isAdminRole } from "@/types";
import { NotificationList } from "./notification-list";

export default async function NotificationsPage() {
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

  const [notifications, totalCount] = await Promise.all([
    getUnreadNotifications(100),
    getTotalUnreadCount(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground sm:text-xl">
          Notifications
        </h1>
        {totalCount > 0 && (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">
            {totalCount} unread
          </span>
        )}
      </div>

      <NotificationList initialNotifications={notifications} />
    </div>
  );
}
