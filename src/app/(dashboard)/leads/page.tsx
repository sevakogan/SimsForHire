import { getLeads, getLeadStats } from "@/lib/actions/leads";
import { LeadsView } from "@/components/leads/leads-view";

export default async function LeadsPage() {
  const [leads, stats] = await Promise.all([getLeads(), getLeadStats()]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">Leads</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.newCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Week</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{stats.thisWeek}</p>
        </div>
      </div>

      {leads.length > 0 ? (
        <LeadsView leads={leads} />
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No leads yet. Leads from the marketing site will appear here.</p>
        </div>
      )}
    </div>
  );
}
