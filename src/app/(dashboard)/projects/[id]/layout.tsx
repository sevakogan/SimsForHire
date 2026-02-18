import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/actions/projects";
import { getClientById } from "@/lib/actions/clients";
import { ProjectSidebar } from "@/components/dashboard/project-sidebar";
import { TagFilterProvider } from "@/components/items/tag-filter-context";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export default async function ProjectLayout({ params, children }: Props) {
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) notFound();

  const client = await getClientById(project.client_id);

  return (
    /* Break out of the parent max-w container so the sidebar can span full width */
    <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-6">
      <TagFilterProvider>
        <ProjectSidebar
          projectId={id}
          clientName={client?.name ?? "Client"}
          projectName={project.name}
          invoiceNumber={project.invoice_number}
          contractSignedAt={project.contract_signed_at}
          projectStatus={project.status}
        >
          {children}
        </ProjectSidebar>
      </TagFilterProvider>
    </div>
  );
}
