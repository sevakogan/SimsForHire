import { getUsers } from "@/lib/actions/users";
import { getClients } from "@/lib/actions/clients";
import { Badge } from "@/components/ui/badge";
import { tableStyles } from "@/components/ui/form-styles";
import { UserActions } from "./user-actions";
import { InviteUserForm } from "./invite-user-form";

export default async function AdminPage() {
  const [users, clients] = await Promise.all([getUsers(), getClients()]);

  // Split into company users (admin/collaborator) and client users
  const companyUsers = users.filter(
    (u) => u.role === "admin" || u.role === "collaborator"
  );
  const clientUsers = users.filter((u) => u.role === "client");
  const pendingUsers = users.filter((u) => u.status === "pending");

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-bold text-foreground sm:text-2xl">
          Admin
        </h1>
      </div>

      {/* Invite User */}
      <InviteUserForm />

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-600">
            Pending Approval ({pendingUsers.length})
          </h2>
          <div className="space-y-2">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.full_name ?? user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <UserActions user={user} clients={clients} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Company Users */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Company Users ({companyUsers.length})
        </h2>

        {companyUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No company users.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className={`${tableStyles.wrapper} hidden sm:block`}>
              <table className={tableStyles.table}>
                <thead className={tableStyles.thead}>
                  <tr>
                    <th className={tableStyles.th}>Name</th>
                    <th className={tableStyles.th}>Email</th>
                    <th className={tableStyles.th}>Role</th>
                    <th className={tableStyles.th}>Status</th>
                    <th className={tableStyles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody className={tableStyles.tbody}>
                  {companyUsers.map((user) => (
                    <tr key={user.id} className={tableStyles.row}>
                      <td className={tableStyles.td}>
                        {user.full_name ?? "--"}
                      </td>
                      <td className={tableStyles.tdMuted}>{user.email}</td>
                      <td className={tableStyles.td}>
                        <Badge variant={user.role}>{user.role}</Badge>
                      </td>
                      <td className={tableStyles.td}>
                        <Badge variant={user.status}>{user.status}</Badge>
                      </td>
                      <td className={tableStyles.td}>
                        <UserActions user={user} clients={clients} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 sm:hidden">
              {companyUsers.map((user) => (
                <UserCard key={user.id} user={user} clients={clients} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Client Users */}
      {clientUsers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Client Users ({clientUsers.length})
          </h2>

          {/* Desktop table */}
          <div className={`${tableStyles.wrapper} hidden sm:block`}>
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>Name</th>
                  <th className={tableStyles.th}>Email</th>
                  <th className={tableStyles.th}>Status</th>
                  <th className={tableStyles.th}>Client</th>
                  <th className={tableStyles.th}>Actions</th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {clientUsers.map((user) => (
                  <tr key={user.id} className={tableStyles.row}>
                    <td className={tableStyles.td}>
                      {user.full_name ?? "--"}
                    </td>
                    <td className={tableStyles.tdMuted}>{user.email}</td>
                    <td className={tableStyles.td}>
                      <Badge variant={user.status}>{user.status}</Badge>
                    </td>
                    <td className={tableStyles.tdMuted}>
                      {user.client_name ?? "--"}
                    </td>
                    <td className={tableStyles.td}>
                      <UserActions user={user} clients={clients} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {clientUsers.map((user) => (
              <UserCard key={user.id} user={user} clients={clients} showClient />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function UserCard({
  user,
  clients,
  showClient,
}: {
  user: import("@/lib/actions/users").ProfileWithClient;
  clients: import("@/types").Client[];
  showClient?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {user.full_name ?? "--"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant={user.role}>{user.role}</Badge>
          <Badge variant={user.status}>{user.status}</Badge>
        </div>
      </div>

      {showClient && user.client_name && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Client: <span className="text-foreground">{user.client_name}</span>
        </p>
      )}

      <div className="mt-2.5 border-t border-border/30 pt-2.5">
        <UserActions user={user} clients={clients} />
      </div>
    </div>
  );
}
