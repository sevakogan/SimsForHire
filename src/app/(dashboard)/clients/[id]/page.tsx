import { notFound } from "next/navigation";
import Link from "next/link";
import { getClientById } from "@/lib/actions/clients";
import { getProjects } from "@/lib/actions/projects";
import { getClientNoteCountsByProjects } from "@/lib/actions/items";
import { ClientDetailClient } from "./client-detail-client";
import { ProjectCard } from "./project-card";
import { buttonStyles, cardStyles } from "@/components/ui/form-styles";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) notFound();

  const projects = await getProjects({ clientId: id });
  const projectIds = projects.map((p) => p.id);
  const noteCountsMap = await getClientNoteCountsByProjects(projectIds);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </div>
        <h1 className="text-lg sm:text-2xl font-bold text-foreground">{client.name}</h1>
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
            <ProjectCard
              key={project.id}
              project={project}
              clientNoteCount={noteCountsMap.get(project.id) ?? 0}
            />
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
