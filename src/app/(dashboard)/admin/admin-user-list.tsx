"use client";

import { useState, useMemo } from "react";
import { UserRow, EmployeeCard } from "./user-row";
import type { ProfileWithClient } from "@/lib/actions/users";
import type { Client } from "@/types";

interface Props {
  users: ProfileWithClient[];
  clients: Client[];
  currentUserId: string;
}

const ROLE_TABS = [
  { label: "All", value: "all", icon: null },
  { label: "Company", value: "company", icon: "M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" },
  { label: "Employees", value: "employee", icon: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" },
  { label: "Clients", value: "client", icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" },
];

export function AdminUserList({ users, clients, currentUserId }: Props) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      // Tab filter
      if (activeTab === "company" && u.role !== "admin" && u.role !== "collaborator") return false;
      if (activeTab === "employee" && u.role !== "employee") return false;
      if (activeTab === "client" && u.role !== "client") return false;
      // Search
      if (q) {
        const nameMatch = (u.full_name ?? "").toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }
      return true;
    });
  }, [users, search, activeTab]);

  const pendingUsers = filtered.filter((u) => u.status === "pending");
  const approvedUsers = filtered.filter((u) => u.status !== "pending");
  const companyUsers = approvedUsers.filter(
    (u) => (u.role === "admin" || u.role === "collaborator") && u.status !== "denied"
  );
  const employeeUsers = approvedUsers.filter(
    (u) => u.role === "employee" && u.status !== "denied"
  );
  const clientUsers = approvedUsers.filter(
    (u) => u.role === "client" && u.status !== "denied"
  );
  const deniedUsers = approvedUsers.filter((u) => u.status === "denied");

  // Stats
  const totalActive = users.filter((u) => u.status === "approved").length;
  const totalPending = users.filter((u) => u.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Users" value={users.length} color="gray" />
        <StatCard label="Active" value={totalActive} color="green" />
        <StatCard label="Pending" value={totalPending} color="amber" />
        <StatCard label="Clients" value={users.filter((u) => u.role === "client").length} color="blue" />
      </div>

      {/* Search + tabs */}
      <div className="space-y-3">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-gray-400 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Role tabs */}
        <div className="flex gap-1 rounded-lg bg-gray-100/80 p-1">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === tab.value
                  ? "bg-white text-foreground shadow-sm"
                  : "text-gray-500 hover:text-foreground"
              }`}
            >
              {tab.icon && (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12">
          <svg className="h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <p className="text-sm text-gray-400">No users found</p>
        </div>
      )}

      {/* Pending Approvals — highlighted section */}
      {pendingUsers.length > 0 && (
        <section>
          <SectionHeader title="Pending Approval" count={pendingUsers.length} variant="amber" />
          <div className="mt-2 overflow-hidden rounded-xl border border-amber-200/60 bg-gradient-to-b from-amber-50/50 to-white">
            {pendingUsers.map((user, i) => (
              <UserRow
                key={user.id}
                user={user}
                clients={clients}
                currentUserId={currentUserId}
                isPending
                showBorder={i < pendingUsers.length - 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* Company Users */}
      {(activeTab === "all" || activeTab === "company") && companyUsers.length > 0 && (
        <section>
          <SectionHeader title="Company" count={companyUsers.length} variant="default" />
          <div className="mt-2 overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
            {companyUsers.map((user, i) => (
              <UserRow
                key={user.id}
                user={user}
                clients={clients}
                currentUserId={currentUserId}
                showBorder={i < companyUsers.length - 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* Employee Users */}
      {(activeTab === "all" || activeTab === "employee") && employeeUsers.length > 0 && (
        <section>
          <SectionHeader title="Employees" count={employeeUsers.length} variant="default" />
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {employeeUsers.map((user) => (
              <EmployeeCard
                key={user.id}
                user={user}
                clients={clients}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </section>
      )}

      {/* Client Users */}
      {(activeTab === "all" || activeTab === "client") && clientUsers.length > 0 && (
        <section>
          <SectionHeader title="Clients" count={clientUsers.length} variant="default" />
          <div className="mt-2 overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
            {clientUsers.map((user, i) => (
              <UserRow
                key={user.id}
                user={user}
                clients={clients}
                currentUserId={currentUserId}
                showClient
                showBorder={i < clientUsers.length - 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* Denied Users — collapsed by default */}
      {deniedUsers.length > 0 && <DeniedSection users={deniedUsers} clients={clients} currentUserId={currentUserId} />}
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    gray: "bg-gray-50 text-gray-600 border-gray-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 ${colorMap[color] ?? colorMap.gray}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">{label}</p>
      <p className="mt-0.5 text-xl font-bold">{value}</p>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  variant = "default",
}: {
  title: string;
  count: number;
  variant?: "default" | "amber";
}) {
  return (
    <div className="flex items-center gap-2.5">
      <h2
        className={`text-xs font-bold uppercase tracking-wider ${
          variant === "amber" ? "text-amber-600" : "text-gray-400"
        }`}
      >
        {title}
      </h2>
      <span
        className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
          variant === "amber"
            ? "bg-amber-100 text-amber-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {count}
      </span>
    </div>
  );
}

function DeniedSection({
  users,
  clients,
  currentUserId,
}: {
  users: ProfileWithClient[];
  clients: Client[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-1 py-1 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        <span className="uppercase tracking-wider">Denied</span>
        <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-100 px-1 text-[10px] font-bold text-red-600">
          {users.length}
        </span>
      </button>
      {open && (
        <div className="mt-2 overflow-hidden rounded-xl border border-red-100 bg-white">
          {users.map((user, i) => (
            <UserRow
              key={user.id}
              user={user}
              clients={clients}
              currentUserId={currentUserId}
              showBorder={i < users.length - 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}
