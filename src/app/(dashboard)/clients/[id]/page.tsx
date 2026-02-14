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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/clients"
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground"
          >
            Clients
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">{client.name}</h1>
        </div>
      </div>

      <div className={`${cardStyles.base} !p-4 sm:!p-6`}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Email
            </p>
            <p className="text-sm text-foreground truncate">{client.email ?? "--"}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Phone
            </p>
            <p className="text-sm text-foreground">{client.phone ?? "--"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Address
            </p>
            <p className="text-sm text-foreground truncate">{client.address ?? "--"}</p>
          </div>
        </div>

        <ClientDetailClient client={client} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Projects</h2>
        <ClientNewProject clientId={id} />
      </div>

      {projects.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-white p-3.5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md sm:p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-medium text-foreground truncate">{project.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
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
