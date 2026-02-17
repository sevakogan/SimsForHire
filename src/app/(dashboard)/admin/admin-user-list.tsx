"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { formStyles } from "@/components/ui/form-styles";
import { UserRow } from "./user-row";
import type { ProfileWithClient } from "@/lib/actions/users";
import type { Client } from "@/types";

interface Props {
  users: ProfileWithClient[];
  clients: Client[];
  currentUserId: string;
}

export function AdminUserList({ users, clients, currentUserId }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (q) {
        const nameMatch = (u.full_name ?? "").toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const pendingUsers = filtered.filter((u) => u.status === "pending");
  const approvedUsers = filtered.filter((u) => u.status !== "pending");
  const companyUsers = approvedUsers.filter(
    (u) => u.role === "admin" || u.role === "collaborator"
  );
  const employeeUsers = approvedUsers.filter((u) => u.role === "employee");
  const clientUsers = approvedUsers.filter((u) => u.role === "client");
  const deniedUsers = approvedUsers.filter((u) => u.status === "denied");
  const activeUsers = approvedUsers.filter((u) => u.status !== "denied");

  return (
    <div className="space-y-5">
      {/* Search & Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${formStyles.input} pl-9`}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`${formStyles.select} w-auto text-xs sm:text-sm`}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="collaborator">Collaborator</option>
            <option value="employee">Employee</option>
            <option value="client">Client</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${formStyles.select} w-auto text-xs sm:text-sm`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No users found.
        </p>
      )}

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Pending
            </h2>
            <Badge variant="pending">{pendingUsers.length}</Badge>
          </div>
          <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
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
      {companyUsers.filter((u) => u.status !== "denied").length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company
            </h2>
            <span className="text-xs text-muted-foreground">
              {companyUsers.filter((u) => u.status !== "denied").length}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            {companyUsers
              .filter((u) => u.status !== "denied")
              .map((user, i, arr) => (
                <UserRow
                  key={user.id}
                  user={user}
                  clients={clients}
                  currentUserId={currentUserId}
                  showBorder={i < arr.length - 1}
                />
              ))}
          </div>
        </section>
      )}

      {/* Employee Users */}
      {employeeUsers.filter((u) => u.status !== "denied").length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Employees
            </h2>
            <span className="text-xs text-muted-foreground">
              {employeeUsers.filter((u) => u.status !== "denied").length}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            {employeeUsers
              .filter((u) => u.status !== "denied")
              .map((user, i, arr) => (
                <UserRow
                  key={user.id}
                  user={user}
                  clients={clients}
                  currentUserId={currentUserId}
                  showEmployeeClients
                  showBorder={i < arr.length - 1}
                />
              ))}
          </div>
        </section>
      )}

      {/* Client Users */}
      {clientUsers.filter((u) => u.status !== "denied").length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Clients
            </h2>
            <span className="text-xs text-muted-foreground">
              {clientUsers.filter((u) => u.status !== "denied").length}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            {clientUsers
              .filter((u) => u.status !== "denied")
              .map((user, i, arr) => (
                <UserRow
                  key={user.id}
                  user={user}
                  clients={clients}
                  currentUserId={currentUserId}
                  showClient
                  showBorder={i < arr.length - 1}
                />
              ))}
          </div>
        </section>
      )}

      {/* Denied Users */}
      {deniedUsers.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-red-400">
              Denied
            </h2>
            <span className="text-xs text-red-400">{deniedUsers.length}</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-red-100 bg-white">
            {deniedUsers.map((user, i) => (
              <UserRow
                key={user.id}
                user={user}
                clients={clients}
                currentUserId={currentUserId}
                showBorder={i < deniedUsers.length - 1}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
