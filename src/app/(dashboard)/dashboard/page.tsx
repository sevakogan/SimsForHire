import { createSupabaseServer } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardClients } from "@/components/dashboard/dashboard-clients";
import type { DashboardClient } from "@/components/dashboard/dashboard-clients";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import type { RevenueData, ProfitData, StatusBreakdown } from "@/components/dashboard/dashboard-charts";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/form-styles";
import { getUnreadNoteCountsByClients } from "@/lib/actions/items";
import { calculateInvoiceTotals } from "@/lib/invoice-calculations";
import type { Profile, Project, Client, ProjectStatus, DiscountType, ProductCategory } from "@/types";
import type { Lead } from "@/types";
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

/* ─── Status color mapping ─── */

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-400",
  quote: "bg-blue-400",
  submitted: "bg-indigo-400",
  accepted: "bg-violet-500",
  paid: "bg-emerald-500",
  preparing: "bg-amber-400",
  shipped: "bg-orange-400",
  received: "bg-teal-500",
  completed: "bg-green-600",
  archived: "bg-gray-300",
};

/* ─── Admin Dashboard ─── */

async function AdminDashboard() {
  const supabase = await createSupabaseServer();
  const adminSupabase = getAdminSupabase();

  // Fetch leads data in parallel with everything else
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [recentLeadsRes, leadsStatsRes, clientsRes, pendingRes, allClientsRes, allProjectsRes, allItemsRes, allPaymentsRes] =
    await Promise.all([
      adminSupabase.from("leads").select("*").order("created_at", { ascending: false }).limit(6),
      Promise.all([
        adminSupabase.from("leads").select("id", { count: "exact", head: true }),
        adminSupabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", oneWeekAgo.toISOString()),
        adminSupabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        adminSupabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "closed"),
        adminSupabase.from("leads").select("id", { count: "exact", head: true }).eq("source", "rent"),
        adminSupabase.from("leads").select("id", { count: "exact", head: true }).eq("source", "lease"),
        adminSupabase.from("leads").select("id", { count: "exact", head: true }).eq("source", "popup"),
      ]),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("clients").select("id, name, phone, email").order("created_at", { ascending: false }),
      supabase.from("projects").select("id, client_id, status, tax_percent, discount_percent, discount_type, discount_amount, additional_discount, created_at").neq("status", "archived"),
      supabase.from("items").select("project_id, category, retail_price, retail_shipping, price_sold_for, my_cost, my_shipping, quantity"),
      supabase.from("payments").select("project_id, amount, status, created_at"),
    ]);

  const recentLeads = (recentLeadsRes.data ?? []) as Lead[];
  const [totalRes, weekRes, awaitingRes, closedRes, rentRes, leaseRes, popupRes] = leadsStatsRes;
  const leadStats = {
    total: totalRes.count ?? 0,
    thisWeek: weekRes.count ?? 0,
    awaiting: awaitingRes.count ?? 0,
    closed: closedRes.count ?? 0,
    rent: rentRes.count ?? 0,
    lease: leaseRes.count ?? 0,
    popup: popupRes.count ?? 0,
  };

  const allClients = allClientsRes.data ?? [];
  const allProjects = allProjectsRes.data ?? [];
  const allItems = allItemsRes.data ?? [];
  const allPayments = allPaymentsRes.data ?? [];

  // Unread note counts
  const clientIds = allClients.map((c) => c.id);
  const unreadNoteCounts = await getUnreadNoteCountsByClients(clientIds);

  // ─── Compute per-project financials ───
  // Group items by project
  const itemsByProject = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = itemsByProject.get(item.project_id) ?? [];
    list.push(item);
    itemsByProject.set(item.project_id, list);
  }

  // Group payments by project
  const succeededPaymentsByProject = new Map<string, number>();
  for (const payment of allPayments) {
    if (payment.status !== "succeeded") continue;
    const current = succeededPaymentsByProject.get(payment.project_id) ?? 0;
    succeededPaymentsByProject.set(payment.project_id, current + payment.amount);
  }

  // Project map for lookups
  const projectClientMap = new Map<string, string>();
  for (const proj of allProjects) {
    projectClientMap.set(proj.id, proj.client_id);
  }

  // Compute per-project totals
  let totalRevenue = 0;
  let totalCost = 0;
  let totalCollected = 0;

  // Per-client financials
  const clientFinancials = new Map<string, { totalCharge: number; totalCost: number }>();

  // Monthly revenue (last 6 months)
  const now = new Date();
  const monthKeys: string[] = [];
  const monthlyData = new Map<string, { revenue: number; cost: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    monthKeys.push(key);
    monthlyData.set(key, { revenue: 0, cost: 0 });
    // Store label mapping
    monthlyData.set(`label-${key}`, { revenue: 0, cost: 0 }); // placeholder
  }

  // Status breakdown
  const statusCounts = new Map<string, number>();

  for (const proj of allProjects) {
    const items = itemsByProject.get(proj.id) ?? [];

    // Count statuses
    const currentCount = statusCounts.get(proj.status) ?? 0;
    statusCounts.set(proj.status, currentCount + 1);

    // Calculate project totals using same logic as project-summaries
    let productsTotal = 0;
    let servicesTotal = 0;
    let shippingTotal = 0;
    let projectCost = 0;

    for (const item of items) {
      const cat = (item.category as ProductCategory) ?? "product";
      const price = Number(item.price_sold_for ?? item.retail_price) || 0;
      const qty = item.quantity ?? 1;
      const shipping = Number(item.retail_shipping) || 0;
      const cost = Number(item.my_cost) || 0;
      const costShipping = Number(item.my_shipping) || 0;

      if (cat === "service") {
        servicesTotal += price * qty;
      } else {
        productsTotal += price * qty;
      }
      shippingTotal += shipping * qty;
      projectCost += (cost + costShipping) * qty;
    }

    const deliveryTotal = servicesTotal + shippingTotal;

    const totals = calculateInvoiceTotals({
      itemsTotal: productsTotal,
      deliveryTotal,
      discountType: proj.discount_type as DiscountType,
      discountPercent: proj.discount_percent,
      discountValue: proj.discount_amount,
      taxPercent: proj.tax_percent,
      additionalDiscount: proj.additional_discount,
    });

    const projectRevenue = totals.grandTotal;
    totalRevenue += projectRevenue;
    totalCost += projectCost;

    // Payments collected for this project (in cents → dollars)
    const paidCents = succeededPaymentsByProject.get(proj.id) ?? 0;
    const paidDollars = paidCents / 100;
    totalCollected += paidDollars;

    // Per-client
    const clientId = proj.client_id;
    const existing = clientFinancials.get(clientId) ?? { totalCharge: 0, totalCost: 0 };
    clientFinancials.set(clientId, {
      totalCharge: existing.totalCharge + projectRevenue,
      totalCost: existing.totalCost + projectCost,
    });

    // Monthly buckets
    const createdAt = new Date(proj.created_at);
    const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const monthEntry = monthlyData.get(monthKey);
    if (monthEntry) {
      monthlyData.set(monthKey, {
        revenue: monthEntry.revenue + projectRevenue,
        cost: monthEntry.cost + projectCost,
      });
    }
  }

  // Build chart data
  const revenue: RevenueData = {
    totalRevenue,
    collected: totalCollected,
    outstanding: Math.max(0, totalRevenue - totalCollected),
  };

  const profitData: ProfitData = {
    totalProfit: totalRevenue - totalCost,
    totalCost,
    totalRevenue,
  };

  const statusBreakdown: StatusBreakdown[] = [
    "draft", "quote", "submitted", "accepted", "paid",
    "preparing", "shipped", "received", "completed",
  ].map((status) => ({
    status,
    count: statusCounts.get(status) ?? 0,
    color: STATUS_COLORS[status] ?? "bg-gray-400",
  }));

  const monthlyRevenue = monthKeys.map((key) => {
    const d = new Date(Number(key.split("-")[0]), Number(key.split("-")[1]) - 1, 1);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const data = monthlyData.get(key) ?? { revenue: 0, cost: 0 };
    return { month: label, revenue: data.revenue, cost: data.cost };
  });

  // Build client data
  const dashboardClients: DashboardClient[] = allClients.map((c) => {
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
    <div className="space-y-4 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your leads and performance</p>
      </div>

      {/* ─── Leads section ─── */}
      <div className="space-y-4">
        {/* Top lead stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{leadStats.total}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{leadStats.thisWeek}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Awaiting Response</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{leadStats.awaiting}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Closed</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{leadStats.closed}</p>
          </div>
        </div>

        {/* Source breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">🏎️</div>
              <div>
                <p className="text-sm text-muted-foreground">Event Rentals</p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">{leadStats.rent}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">📋</div>
              <div>
                <p className="text-sm text-muted-foreground">Lease Inquiries</p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">{leadStats.lease}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">🎯</div>
              <div>
                <p className="text-sm text-muted-foreground">Popup Leads</p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">{leadStats.popup}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent leads */}
        {recentLeads.length > 0 && (
          <div className="rounded-xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Recent Leads</h2>
              <Link href="/leads" className="text-sm font-medium text-[#E10600] hover:underline">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "5px",
                      background: lead.status === "new" ? "rgba(225,6,0,0.08)" : lead.status === "booked" ? "rgba(48,209,88,0.08)" : lead.status === "lost" ? "rgba(120,120,128,0.1)" : "rgba(255,159,10,0.08)",
                      color: lead.status === "new" ? "#E10600" : lead.status === "booked" ? "#30D158" : lead.status === "lost" ? "#6C6C70" : "#FF9F0A",
                      border: `1px solid ${lead.status === "new" ? "rgba(225,6,0,0.13)" : lead.status === "booked" ? "rgba(48,209,88,0.13)" : lead.status === "lost" ? "rgba(120,120,128,0.15)" : "rgba(255,159,10,0.13)"}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lead.status === "in_progress" ? "In Progress" : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{lead.name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                  </div>
                  <span className="hidden text-[11px] uppercase tracking-[0.5px] text-muted-foreground sm:block">
                    {lead.source}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(lead.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Projects & Revenue section ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Projects & Revenue</h2>
          <Link href="/clients/new" className={`${buttonStyles.primary} text-xs sm:text-sm`}>
            Add Client
          </Link>
        </div>

      {/* Charts row: Revenue, Profit, Monthly */}
      <DashboardCharts
        revenue={revenue}
        profit={profitData}
        statusBreakdown={statusBreakdown}
        monthlyRevenue={monthlyRevenue}
      />

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          label="Total Clients"
          value={clientsRes.count ?? 0}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          }
        />
        <StatCard
          label="Active Projects"
          value={allProjects.length}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
          }
        />
        <StatCard
          label="Pending Users"
          value={pendingRes.count ?? 0}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
      </div>

      {/* Clients section */}
      <DashboardClients clients={dashboardClients} />
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

/* ─── Employee Dashboard ─── */

async function EmployeeDashboard({ profileId }: { profileId: string }) {
  const supabase = await createSupabaseServer();

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

  const { data: allClients } = await supabase
    .from("clients")
    .select("id, name, phone, email")
    .in("id", assignedClientIds)
    .order("created_at", { ascending: false });

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

/* ─── Client Dashboard ─── */

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
