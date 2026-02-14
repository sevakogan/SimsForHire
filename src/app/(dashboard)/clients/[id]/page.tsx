import { notFound } from "next/navigation";
import Link from "next/link";
import { getClientById } from "@/lib/actions/clients";
import { getProjects } from "@/lib/actions/projects";
import { getUnreadNoteCountsByProjects } from "@/lib/actions/items";
import { ClientDetailClient } from "./client-detail-client";
import { ProjectsSection } from "./projects-section";
import { cardStyles } from "@/components/ui/form-styles";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) notFound();

  const projects = await getProjects({ clientId: id });
  const projectIds = projects.map((p) => p.id);
  const noteCountsMap = await getUnreadNoteCountsByProjects(projectIds);

  // Convert Map to plain object for serialization across server/client boundary
  const noteCounts: Record<string, number> = {};
  noteCountsMap.forEach((count, projectId) => {
    noteCounts[projectId] = count;
  });

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

      <ProjectsSection
        projects={projects}
        clientId={id}
        noteCounts={noteCounts}
      />
    </div>
  );
}
