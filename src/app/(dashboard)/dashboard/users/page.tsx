import { getUsers } from "@/lib/actions/users";
import { getClients } from "@/lib/actions/clients";
import { Badge } from "@/components/ui/badge";
import { tableStyles } from "@/components/ui/form-styles";
import { UserActions } from "./user-actions";

export default async function UsersPage() {
  const [users, clients] = await Promise.all([getUsers(), getClients()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">User Management</h1>

      <div className={tableStyles.wrapper}>
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
    </div>
  );
}
