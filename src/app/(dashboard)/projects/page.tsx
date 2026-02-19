import { getProjectsWithClients } from "@/lib/actions/projects";
import { getUnreadNoteCountsByProjects } from "@/lib/actions/items";
import { getProjectSummaries } from "@/lib/actions/project-summaries";
import { AllProjectsView } from "./all-projects-view";

export default async function AllProjectsPage() {
  const projects = await getProjectsWithClients();
  const projectIds = projects.map((p) => p.id);

  const [noteCountsMap, summaries] = await Promise.all([
    getUnreadNoteCountsByProjects(projectIds),
    getProjectSummaries(projects),
  ]);

  const noteCounts: Record<string, number> = {};
  noteCountsMap.forEach((count, projectId) => {
    noteCounts[projectId] = count;
  });

  // Derive unique clients from projects for the filter dropdown
  const clientMap = new Map<string, string>();
  for (const p of projects) {
    clientMap.set(p.client_id, p.client_name);
  }
  const clients = [...clientMap.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">
        All Projects
      </h1>

      <AllProjectsView
        projects={projects}
        noteCounts={noteCounts}
        summaries={summaries}
        clients={clients}
      />
    </div>
  );
}
