import { createSupabaseServer } from "@/lib/supabase-server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/form-styles";
import type { Profile, Project, Client } from "@/types";
import { isAdminRole } from "@/types";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const typedProfile = profile as Profile;
  const admin = isAdminRole(typedProfile.role);

  if (admin) {
    return <AdminDashboard />;
  }

  return <ClientDashboard clientId={typedProfile.client_id} />;
}

async function AdminDashboard() {
  const supabase = await createSupabaseServer();

  const [clientsRes, projectsRes, pendingRes] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const { data: recentProjects } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/clients/new" className={buttonStyles.primary}>
            Add Client
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Clients" value={clientsRes.count ?? 0} />
        <StatCard label="Total Projects" value={projectsRes.count ?? 0} />
        <StatCard label="Pending Users" value={pendingRes.count ?? 0} />
      </div>

      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Recent Projects
        </h2>
        {recentProjects && recentProjects.length > 0 ? (
          <div className="space-y-3">
            {recentProjects.map((p) => {
              const project = p as Project & { clients: { name: string } | null };
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:border-primary/20 hover:shadow-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.clients?.name ?? "Unknown client"}
                    </p>
                  </div>
                  <Badge variant={project.status}>{project.status}</Badge>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        )}
      </div>
    </div>
  );
}

async function ClientDashboard({ clientId }: { clientId: string | null }) {
  if (!clientId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Welcome</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account has not been linked to a client yet. Please contact the
            admin.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServer();

  const [clientRes, projectsRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).single(),
    supabase
      .from("projects")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ]);

  const client = clientRes.data as Client | null;
  const projects = (projectsRes.data ?? []) as Project[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {client?.name ?? "Dashboard"}
      </h1>

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
              <div className="flex items-center gap-3">
                <Badge variant={project.status}>{project.status}</Badge>
                {project.invoice_link && (
                  <span className="text-xs text-primary">Invoice</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No quotes yet.</p>
      )}
    </div>
  );
}
