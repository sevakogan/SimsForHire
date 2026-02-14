import { notFound } from "next/navigation";
import Link from "next/link";
import { getClientById } from "@/lib/actions/clients";
import { getProjects } from "@/lib/actions/projects";
import { ClientDetailClient } from "./client-detail-client";
import { Badge } from "@/components/ui/badge";
import { buttonStyles, cardStyles } from "@/components/ui/form-styles";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) notFound();

  const projects = await getProjects({ clientId: id });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/clients"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clients
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
        </div>
      </div>

      <div className={cardStyles.base}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Email
            </p>
            <p className="text-sm text-foreground">{client.email ?? "--"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Phone
            </p>
            <p className="text-sm text-foreground">{client.phone ?? "--"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Address
            </p>
            <p className="text-sm text-foreground">{client.address ?? "--"}</p>
          </div>
        </div>

        <ClientDetailClient client={client} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Projects</h2>
        <ClientNewProject clientId={id} />
      </div>

      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
            >
              <div>
                <p className="font-medium text-foreground">{project.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={project.status}>{project.status}</Badge>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      )}
    </div>
  );
}

function ClientNewProject({ clientId }: { clientId: string }) {
  return (
    <Link
      href={`/clients/${clientId}/new-project`}
      className={buttonStyles.primary}
    >
      New Project
    </Link>
  );
}
