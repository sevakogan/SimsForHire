import Link from "next/link";
import { getClients } from "@/lib/actions/clients";
import { buttonStyles } from "@/components/ui/form-styles";
import { ClientsView } from "@/components/clients/clients-view";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-2xl font-bold text-foreground">Clients</h1>
        <Link href="/clients/new" className={`${buttonStyles.primary} text-xs sm:text-sm`}>
          Add Client
        </Link>
      </div>

      {clients.length > 0 ? (
        <ClientsView clients={clients} />
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
