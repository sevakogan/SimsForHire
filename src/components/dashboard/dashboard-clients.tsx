"use client";

import { useState } from "react";
import Link from "next/link";

export interface DashboardClient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  totalCharge: number;
  totalCost: number;
  unreadNotes: number;
}

interface DashboardClientsProps {
  clients: DashboardClient[];
  showProfit?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-indigo-500 to-indigo-600",
    "from-violet-500 to-violet-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
    "from-rose-500 to-rose-600",
    "from-emerald-500 to-emerald-600",
    "from-teal-500 to-teal-600",
    "from-cyan-500 to-cyan-600",
    "from-sky-500 to-sky-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
  }
  return { first: fullName, last: "" };
}

export function DashboardClients({ clients, showProfit = true }: DashboardClientsProps) {
  const [view, setView] = useState<"cards" | "list">("cards");

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
        <p className="text-sm text-muted-foreground">No clients yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground sm:text-lg">Clients</h2>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
          <button
            onClick={() => setView("cards")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              view === "cards"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
            </svg>
            Cards
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              view === "list"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
            </svg>
            List
          </button>
        </div>
      </div>

      {view === "cards" ? (
        <CardsView clients={clients} showProfit={showProfit} />
      ) : (
        <ListView clients={clients} showProfit={showProfit} />
      )}
    </div>
  );
}

function CardsView({ clients, showProfit = true }: { clients: DashboardClient[]; showProfit?: boolean }) {
  return (
    <div className="flex flex-wrap gap-4">
      {clients.map((client) => {
        const initials = getInitials(client.name);
        const colorClass = getAvatarColor(client.name);
        const profit = client.totalCharge - client.totalCost;

        return (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="group relative w-full overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 sm:w-[350px]"
            style={{ aspectRatio: "3.5 / 2" }}
          >
            {/* Left accent stripe */}
            <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${colorClass}`} />

            {/* Unread notes badge */}
            {client.unreadNotes > 0 && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                {client.unreadNotes}
              </div>
            )}

            <div className="flex h-full flex-col justify-between pl-5 pr-4 py-4">
              {/* Top section: avatar + name + contact */}
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${colorClass} text-sm font-bold text-white shadow-sm`}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground leading-snug truncate">
                    {client.name}
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {client.phone && (
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3 w-3 shrink-0 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                        </svg>
                        <span className="text-[11px] text-muted-foreground truncate">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3 w-3 shrink-0 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                        <span className="text-[11px] text-muted-foreground truncate">{client.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom section: financials */}
              {showProfit && (
                <div className="flex items-end justify-between border-t border-border/30 pt-2">
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">Total Charge</p>
                    <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(client.totalCharge)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">Profit</p>
                    <p className={`text-sm font-bold tabular-nums ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(profit)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ListView({ clients, showProfit = true }: { clients: DashboardClient[]; showProfit?: boolean }) {
  return (
    <div className="space-y-2">
      {clients.map((client) => {
        const profit = client.totalCharge - client.totalCost;

        return (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="flex items-center justify-between rounded-xl border border-border/60 bg-white p-3 shadow-sm transition-all hover:border-primary/20 hover:shadow-md sm:p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate sm:text-base">{client.name}</p>
                {client.unreadNotes > 0 && (
                  <span className="flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                    {client.unreadNotes}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {client.phone && <span>{client.phone}</span>}
                {client.email && <span className="truncate">{client.email}</span>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-4 sm:gap-6 text-right">
              {showProfit && (
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60 sm:text-[10px]">Charge</p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(client.totalCharge)}</p>
                </div>
              )}
              {showProfit && (
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60 sm:text-[10px]">Profit</p>
                  <p className={`text-sm font-semibold tabular-nums ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(profit)}
                  </p>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
