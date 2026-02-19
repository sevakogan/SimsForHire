import { getUsers, getClientsAdmin } from "@/lib/actions/users";
import type { ProfileWithClient } from "@/lib/actions/users";
import { InviteUserForm } from "./invite-user-form";
import { AdminUserList } from "./admin-user-list";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { Client } from "@/types";

export default async function AdminPage() {
  let users: ProfileWithClient[];
  let clients: Client[];
  let currentUserId: string | null = null;

  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;

    [users, clients] = await Promise.all([getUsers(), getClientsAdmin()]);
  } catch (err) {
    console.error("Admin page load error:", err);
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-foreground sm:text-2xl">Admin</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Failed to load admin data. Please try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Team Management
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Manage users, roles, and permissions
          </p>
        </div>
        <InviteUserForm />
      </div>

      <AdminUserList
        users={users}
        clients={clients}
        currentUserId={currentUserId ?? ""}
      />
    </div>
  );
}
