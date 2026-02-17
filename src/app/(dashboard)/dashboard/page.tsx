import { createSupabaseServer } from "@/lib/supabase-server";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardClients } from "@/components/dashboard/dashboard-clients";
import type { DashboardClient } from "@/components/dashboard/dashboard-clients";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/form-styles";
import { getUnreadNoteCountsByClients } from "@/lib/actions/items";
import type { Profile, Project, Client, Item } from "@/types";
import { isAdminRole, isEmployeeRole } from "@/types";

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

  if (isEmployeeRole(typedProfile.role)) {
    return <EmployeeDashboard profileId={typedProfile.id} />;
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

  // Fetch all clients with their projects → items for financial rollup
  const { data: allClients } = await supabase
    .from("clients")
    .select("id, name, phone, email")
    .order("created_at", { ascending: false });

  const { data: allItems } = await supabase
    .from("items")
    .select("project_id, retail_price, retail_shipping, price_sold_for, my_cost, my_shipping, projects!inner(client_id)");

  const { data: allProjects } = await supabase
    .from("projects")
    .select("id, client_id");

  // Fetch unread note counts per client in parallel with financial rollup
  const clientIds = (allClients ?? []).map((c) => c.id);
  const unreadNoteCounts = await getUnreadNoteCountsByClients(clientIds);

  // Build per-client financials
  const clientFinancials = new Map<string, { totalCharge: number; totalCost: number }>();

  if (allItems && allProjects) {
    // Map project_id → client_id
    const projectClientMap = new Map<string, string>();
    for (const proj of allProjects) {
      projectClientMap.set(proj.id, proj.client_id);
    }

    for (const item of allItems) {
      const clientId = projectClientMap.get(item.project_id);
      if (!clientId) continue;

      const sellingPrice = item.price_sold_for ?? item.retail_price;
      const charge = sellingPrice + Number(item.retail_shipping);
      const cost = Number(item.my_cost) + Number(item.my_shipping);

      const existing = clientFinancials.get(clientId) ?? { totalCharge: 0, totalCost: 0 };
      clientFinancials.set(clientId, {
        totalCharge: existing.totalCharge + charge,
        totalCost: existing.totalCost + cost,
      });
    }
  }

  const dashboardClients: DashboardClient[] = (allClients ?? []).map((c) => {
    const financials = clientFinancials.get(c.id) ?? { totalCharge: 0, totalCost: 0 };
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      totalCharge: financials.totalCharge,
      totalCost: financials.totalCost,
      unreadNotes: unreadNoteCounts.get(c.id) ?? 0,
    };
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex gap-2 sm:gap-3">
          <Link href="/clients/new" className={`${buttonStyles.primary} text-xs sm:text-sm`}>
            Add Client
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard label="Total Clients" value={clientsRes.count ?? 0} />
        <StatCard label="Total Projects" value={projectsRes.count ?? 0} />
        <StatCard label="Pending Users" value={pendingRes.count ?? 0} />
      </div>

      <DashboardClients clients={dashboardClients} />
    </div>
  );
}

async function EmployeeDashboard({ profileId }: { profileId: string }) {
  const supabase = await createSupabaseServer();

  // Fetch assigned client IDs
  const { data: assignments } = await supabase
    .from("employee_client_assignments")
    .select("client_id")
    .eq("employee_id", profileId);

  const assignedClientIds = (assignments ?? []).map((a: { client_id: string }) => a.client_id);

  if (assignedClientIds.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Welcome</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You have not been assigned to any clients yet. Please contact the admin.
          </p>
        </div>
      </div>
    );
  }

  // Fetch assigned clients
  const { data: allClients } = await supabase
    .from("clients")
    .select("id, name, phone, email")
    .in("id", assignedClientIds)
    .order("created_at", { ascending: false });

  // Build dashboard data WITHOUT cost/profit
  const dashboardClients: DashboardClient[] = (allClients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    totalCharge: 0,
    totalCost: 0,
    unreadNotes: 0,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">Dashboard</h1>
      <DashboardClients clients={dashboardClients} showProfit={false} />
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
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">
        {client?.name ?? "Dashboard"}
      </h1>

      {projects.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-white p-3.5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md sm:p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate sm:text-base">{project.name}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <Badge variant={project.status}>{project.status}</Badge>
                {project.invoice_link && (
                  <span className="hidden text-xs text-primary sm:block">Invoice</span>
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
