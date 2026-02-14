"use client";

import { useState } from "react";
import Link from "next/link";
import { tableStyles } from "@/components/ui/form-styles";
import type { Client } from "@/types";

interface ClientsViewProps {
  clients: Client[];
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

export function ClientsView({ clients }: ClientsViewProps) {
  const [view, setView] = useState<"card" | "inline">("card");

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5 w-fit">
        <button
          onClick={() => setView("card")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            view === "card"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
          </svg>
          Card View
        </button>
        <button
          onClick={() => setView("inline")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            view === "inline"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
          </svg>
          Inline View
        </button>
      </div>

      {view === "card" ? (
        <CardView clients={clients} />
      ) : (
        <InlineView clients={clients} />
      )}
    </div>
  );
}

function CardView({ clients }: { clients: Client[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => {
        const { first, last } = splitName(client.name);
        const initials = getInitials(client.name);
        const colorClass = getAvatarColor(client.name);

        return (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5"
          >
            {/* Top accent bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${colorClass}`} />

            <div className="p-5">
              {/* Avatar + name */}
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colorClass} text-lg font-bold text-white shadow-sm`}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-base font-semibold text-foreground leading-tight">
                    {first}
                  </p>
                  {last && (
                    <p className="text-base font-semibold text-foreground leading-tight">
                      {last}
                    </p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="my-3.5 border-t border-border/40" />

              {/* Contact info */}
              <div className="space-y-2">
                {client.phone && (
                  <div className="flex items-center gap-2.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    <span className="text-sm text-foreground/80 truncate">{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    <span className="text-sm text-foreground/80 truncate">{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2.5">
                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <span className="text-xs text-muted-foreground/70 line-clamp-2">{client.address}</span>
                  </div>
                )}
                {!client.phone && !client.email && !client.address && (
                  <p className="text-xs text-muted-foreground/40 italic">No contact info</p>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function InlineView({ clients }: { clients: Client[] }) {
  return (
    <>
      {/* Desktop table */}
      <div className={`${tableStyles.wrapper} hidden sm:block`}>
        <table className={tableStyles.table}>
          <thead className={tableStyles.thead}>
            <tr>
              <th className={tableStyles.th}>Name</th>
              <th className={tableStyles.th}>Email</th>
              <th className={tableStyles.th}>Phone</th>
              <th className={tableStyles.th}>Created</th>
            </tr>
          </thead>
          <tbody className={tableStyles.tbody}>
            {clients.map((client) => (
              <tr key={client.id} className={tableStyles.row}>
                <td className={tableStyles.td}>
                  <Link
                    href={`/clients/${client.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className={tableStyles.tdMuted}>
                  {client.email ?? "--"}
                </td>
                <td className={tableStyles.tdMuted}>
                  {client.phone ?? "--"}
                </td>
                <td className={tableStyles.tdMuted}>
                  {new Date(client.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="space-y-2 sm:hidden">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="block rounded-xl border border-border bg-white p-3.5 transition-all hover:border-primary/20 hover:shadow-sm"
          >
            <p className="text-sm font-medium text-foreground">{client.name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              {client.email && <span>{client.email}</span>}
              {client.phone && <span>{client.phone}</span>}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
