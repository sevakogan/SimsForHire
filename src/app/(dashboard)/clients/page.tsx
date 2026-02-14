import Link from "next/link";
import { getClients } from "@/lib/actions/clients";
import { buttonStyles, tableStyles } from "@/components/ui/form-styles";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <Link href="/clients/new" className={buttonStyles.primary}>
          Add Client
        </Link>
      </div>

      {clients.length > 0 ? (
        <div className={tableStyles.wrapper}>
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>Name</th>
                <th className={tableStyles.th}>Email</th>
                <th className={tableStyles.th}>Phone</th>
                <th className={tableStyles.th}>Created</th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {clients.map((client) => (
                <tr key={client.id} className={tableStyles.row}>
                  <td className={tableStyles.td}>
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className={tableStyles.tdMuted}>
                    {client.email ?? "--"}
                  </td>
                  <td className={tableStyles.tdMuted}>
                    {client.phone ?? "--"}
                  </td>
                  <td className={tableStyles.tdMuted}>
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No clients yet.</p>
          <Link
            href="/clients/new"
            className={`${buttonStyles.primary} mt-4 inline-flex`}
          >
            Add First Client
          </Link>
        </div>
      )}
    </div>
  );
}
