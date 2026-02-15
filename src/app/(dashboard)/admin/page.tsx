import { getUsers } from "@/lib/actions/users";
import { getClients } from "@/lib/actions/clients";
import { Badge } from "@/components/ui/badge";
import { tableStyles } from "@/components/ui/form-styles";
import { UserActions } from "./user-actions";

export default async function UsersPage() {
  const [users, clients] = await Promise.all([getUsers(), getClients()]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">User Management</h1>

      {/* Desktop table */}
      <div className={`${tableStyles.wrapper} hidden sm:block`}>
        <table className={tableStyles.table}>
          <thead className={tableStyles.thead}>
            <tr>
              <th className={tableStyles.th}>Name</th>
              <th className={tableStyles.th}>Email</th>
              <th className={tableStyles.th}>Role</th>
              <th className={tableStyles.th}>Status</th>
              <th className={tableStyles.th}>Client</th>
              <th className={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableStyles.tbody}>
            {users.map((user) => (
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

      {/* Mobile card list */}
      <div className="space-y-2 sm:hidden">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-xl border border-border/40 bg-white p-3"
          >
            {/* Name + badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.full_name ?? "--"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Badge variant={user.role}>{user.role}</Badge>
                <Badge variant={user.status}>{user.status}</Badge>
              </div>
            </div>

            {/* Client assignment */}
            {user.client_name && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Client: <span className="text-foreground">{user.client_name}</span>
              </p>
            )}

            {/* Actions */}
            <div className="mt-2.5 border-t border-border/30 pt-2.5">
              <UserActions user={user} clients={clients} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
