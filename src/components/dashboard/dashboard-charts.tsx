"use client";

import { useMemo } from "react";

/* ─── Types ─── */

export interface RevenueData {
  totalRevenue: number;
  collected: number;
  outstanding: number;
}

export interface ProfitData {
  totalProfit: number;
  totalCost: number;
  totalRevenue: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  color: string;
}

interface DashboardChartsProps {
  revenue: RevenueData;
  profit: ProfitData;
  statusBreakdown: StatusBreakdown[];
  monthlyRevenue: { month: string; revenue: number; cost: number }[];
}

/* ─── Helpers ─── */

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/* ─── Main Component ─── */

export function DashboardCharts({
  revenue,
  profit,
  statusBreakdown,
  monthlyRevenue,
}: DashboardChartsProps) {
  const maxMonthly = useMemo(
    () => Math.max(...monthlyRevenue.map((m) => m.revenue), 1),
    [monthlyRevenue]
  );

  const profitMargin = revenue.totalRevenue > 0
    ? ((profit.totalProfit / revenue.totalRevenue) * 100).toFixed(1)
    : "0.0";

  const collectedPct = revenue.totalRevenue > 0
    ? Math.round((revenue.collected / revenue.totalRevenue) * 100)
    : 0;

  const totalStatusCount = statusBreakdown.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {/* ─── Revenue & Collection chart ─── */}
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue</h3>
          <span className="text-[10px] text-muted-foreground/60">{collectedPct}% collected</span>
        </div>
        <p className="text-xl font-bold text-foreground tabular-nums">{formatCurrencyFull(revenue.totalRevenue)}</p>

        {/* Collection bar */}
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-emerald-600 font-medium">Collected</span>
              <span className="text-foreground font-semibold tabular-nums">{formatCurrencyFull(revenue.collected)}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${collectedPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-amber-600 font-medium">Outstanding</span>
              <span className="text-foreground font-semibold tabular-nums">{formatCurrencyFull(revenue.outstanding)}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${revenue.totalRevenue > 0 ? Math.round((revenue.outstanding / revenue.totalRevenue) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Profit chart ─── */}
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profit</h3>
          <span className="text-[10px] text-muted-foreground/60">{profitMargin}% margin</span>
        </div>
        <p className={`text-xl font-bold tabular-nums ${profit.totalProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {formatCurrencyFull(profit.totalProfit)}
        </p>

        {/* Revenue vs Cost stacked bar */}
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-blue-600 font-medium">Revenue</span>
              <span className="text-foreground font-semibold tabular-nums">{formatCurrencyFull(profit.totalRevenue)}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: "100%" }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-red-500 font-medium">Cost</span>
              <span className="text-foreground font-semibold tabular-nums">{formatCurrencyFull(profit.totalCost)}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-red-400 transition-all"
                style={{ width: `${profit.totalRevenue > 0 ? Math.round((profit.totalCost / profit.totalRevenue) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Monthly revenue bar chart + status donut ─── */}
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Monthly Revenue</h3>

        {/* Bar chart */}
        {monthlyRevenue.length > 0 ? (
          <div className="flex items-end gap-1 h-20">
            {monthlyRevenue.map((m) => {
              const pct = (m.revenue / maxMonthly) * 100;
              const costPct = maxMonthly > 0 ? (m.cost / maxMonthly) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5" title={`${m.month}: ${formatCurrency(m.revenue)}`}>
                  <div className="w-full flex flex-col items-stretch justify-end h-16 relative">
                    {/* Revenue bar */}
                    <div
                      className="w-full rounded-t bg-blue-400 transition-all hover:bg-blue-500"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                    {/* Cost overlay */}
                    <div
                      className="w-full bg-red-300/50 absolute bottom-0 rounded-t"
                      style={{ height: `${Math.max(costPct, 0)}%` }}
                    />
                  </div>
                  <span className="text-[7px] text-muted-foreground/60 leading-none">{m.month}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/40">
            No data yet
          </div>
        )}

        {/* Status breakdown */}
        <div className="mt-3 border-t border-border/30 pt-2">
          <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
            {statusBreakdown.map((s) => (
              <div
                key={s.status}
                className={`h-full ${s.color} transition-all`}
                style={{ width: `${totalStatusCount > 0 ? (s.count / totalStatusCount) * 100 : 0}%` }}
                title={`${s.status}: ${s.count}`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {statusBreakdown.filter((s) => s.count > 0).map((s) => (
              <div key={s.status} className="flex items-center gap-1">
                <div className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                <span className="text-[9px] text-muted-foreground capitalize">{s.status} ({s.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
