import { getProjectsWithClients } from "@/lib/actions/projects";
import { getUnreadNoteCountsByProjects } from "@/lib/actions/items";
import { AllProjectsView } from "./all-projects-view";

export default async function AllProjectsPage() {
  const projects = await getProjectsWithClients();
  const projectIds = projects.map((p) => p.id);
  const noteCountsMap = await getUnreadNoteCountsByProjects(projectIds);

  const noteCounts: Record<string, number> = {};
  noteCountsMap.forEach((count, projectId) => {
    noteCounts[projectId] = count;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">
        All Projects
      </h1>

      <AllProjectsView projects={projects} noteCounts={noteCounts} />
    </div>
  );
}
