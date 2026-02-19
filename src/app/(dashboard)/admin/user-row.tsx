"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  approveAsClient,
  approveAsEmployee,
  denyUser,
  assignClientToUser,
  assignClientsToEmployee,
  updateUserRole,
  deleteUser,
} from "@/lib/actions/users";
import { Badge } from "@/components/ui/badge";
import { buttonStyles, formStyles } from "@/components/ui/form-styles";
import type { ProfileWithClient } from "@/lib/actions/users";
import type { Client, UserRole } from "@/types";

/* ─── Shared avatar helper ─── */

function UserAvatar({
  user,
  size = "md",
}: {
  user: ProfileWithClient;
  size?: "sm" | "md" | "lg";
}) {
  const dims = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-11 w-11" }[size];
  const text = { sm: "text-[9px]", md: "text-xs", lg: "text-sm" }[size];
  const initials = (user.full_name ?? user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const colorMap: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    collaborator: "bg-indigo-100 text-indigo-700",
    employee: "bg-emerald-100 text-emerald-700",
    client: "bg-blue-100 text-blue-700",
  };
  const bg = colorMap[user.role] ?? "bg-gray-100 text-gray-600";

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name ?? ""}
        className={`${dims} rounded-full object-cover`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className={`flex ${dims} items-center justify-center rounded-full ${bg} ${text} font-bold`}>
      {initials}
    </div>
  );
}

/* ─── Main UserRow ─── */

interface Props {
  user: ProfileWithClient;
  clients: Client[];
  currentUserId: string;
  isPending?: boolean;
  showClient?: boolean;
  showBorder?: boolean;
}

export function UserRow({
  user,
  clients,
  currentUserId,
  isPending,
  showClient,
  showBorder,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSelf = user.id === currentUserId;

  async function handleApproveAsClient() {
    setLoading(true);
    await approveAsClient(user.id);
    router.refresh();
    setLoading(false);
  }

  async function handleApproveAsEmployee() {
    setLoading(true);
    await approveAsEmployee(user.id);
    router.refresh();
    setLoading(false);
  }

  async function handleDeny() {
    setLoading(true);
    await denyUser(user.id);
    router.refresh();
    setLoading(false);
  }

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as UserRole;
    setLoading(true);
    await updateUserRole(user.id, role);
    router.refresh();
    setLoading(false);
  }

  async function handleAssignClient(e: React.ChangeEvent<HTMLSelectElement>) {
    const clientId = e.target.value;
    if (!clientId) return;
    setLoading(true);
    await assignClientToUser(user.id, clientId);
    router.refresh();
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    await deleteUser(user.id);
    router.refresh();
    setLoading(false);
    setConfirmDelete(false);
  }

  // Delete confirmation overlay
  if (confirmDelete) {
    return (
      <div
        className={`flex items-center justify-between px-4 py-3 bg-red-50 ${
          showBorder ? "border-b border-red-100" : ""
        }`}
      >
        <span className="text-sm text-red-600">
          Delete <span className="font-semibold">{user.full_name ?? user.email}</span>?
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "..." : "Delete"}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            disabled={loading}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50/80 ${
        showBorder ? "border-b border-gray-100" : ""
      }`}
    >
      {/* Avatar */}
      <UserAvatar user={user} />

      {/* Name + Email */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.full_name ?? "--"}
          </p>
          {isSelf && (
            <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              you
            </span>
          )}
        </div>
        <p className="truncate text-xs text-gray-400">{user.email}</p>
      </div>

      {/* Client name (for client users) */}
      {showClient && (
        <p className="hidden shrink-0 text-xs font-medium text-gray-500 sm:block w-28 truncate">
          {user.client_name ?? "--"}
        </p>
      )}

      {/* Badges */}
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <Badge variant={user.role}>{user.role}</Badge>
        {user.status === "approved" && !user.invite_accepted ? (
          <Badge variant="invite_pending">invite pending</Badge>
        ) : (
          <Badge variant={user.status}>{user.status}</Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {isPending ? (
          // Pending: approve buttons
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleApproveAsClient}
              disabled={loading}
              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
            >
              Client
            </button>
            <button
              onClick={handleApproveAsEmployee}
              disabled={loading}
              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
            >
              Employee
            </button>
            <button
              onClick={handleDeny}
              disabled={loading}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        ) : (
          // Approved/Denied: role selector
          <>
            {!isSelf && (
              <select
                onChange={handleRoleChange}
                defaultValue={user.role}
                disabled={loading}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="client">client</option>
                <option value="employee">employee</option>
                <option value="collaborator">collaborator</option>
                <option value="admin">admin</option>
              </select>
            )}

            {!isSelf && user.role === "client" && (
              <select
                onChange={handleAssignClient}
                defaultValue={user.client_id ?? ""}
                disabled={loading}
                className="hidden rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:block"
              >
                <option value="">Assign client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        {/* Delete button — hidden for self */}
        {!isSelf && (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={loading}
            className="ml-0.5 rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100"
            title="Delete user"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Employee card with client assignment chips ── */

export function EmployeeCard({
  user,
  clients,
  currentUserId,
}: {
  user: ProfileWithClient;
  clients: Client[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(user.assigned_client_ids ?? [])
  );
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSelf = user.id === currentUserId;
  const assignedClients = clients.filter((c) => selected.has(c.id));
  const unassignedClients = clients.filter((c) => !selected.has(c.id));

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [dropdownOpen]);

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as UserRole;
    setLoading(true);
    await updateUserRole(user.id, role);
    router.refresh();
    setLoading(false);
  }

  async function handleToggleClient(clientId: string) {
    const newSelected = new Set(selected);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelected(newSelected);
    setSaving(true);
    await assignClientsToEmployee(user.id, [...newSelected]);
    router.refresh();
    setSaving(false);
  }

  async function handleRemoveClient(clientId: string) {
    const newSelected = new Set(selected);
    newSelected.delete(clientId);
    setSelected(newSelected);
    setSaving(true);
    await assignClientsToEmployee(user.id, [...newSelected]);
    router.refresh();
    setSaving(false);
  }

  async function handleDelete() {
    setLoading(true);
    await deleteUser(user.id);
    router.refresh();
    setLoading(false);
    setConfirmDelete(false);
  }

  return (
    <div className="group rounded-xl border border-gray-200/80 bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        {/* Avatar */}
        <UserAvatar user={user} size="lg" />

        {/* Name + email */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.full_name ?? "--"}
            </p>
            {isSelf && (
              <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                you
              </span>
            )}
          </div>
          <p className="truncate text-xs text-gray-400">{user.email}</p>
        </div>

        {/* Badges */}
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <Badge variant="employee">employee</Badge>
          {user.status === "approved" && !user.invite_accepted ? (
            <Badge variant="invite_pending">invite pending</Badge>
          ) : (
            <Badge variant={user.status}>{user.status}</Badge>
          )}
        </div>

        {/* Role selector + delete */}
        <div className="flex shrink-0 items-center gap-1.5">
          {!isSelf && (
            <select
              onChange={handleRoleChange}
              defaultValue={user.role}
              disabled={loading}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="client">client</option>
              <option value="employee">employee</option>
              <option value="collaborator">collaborator</option>
              <option value="admin">admin</option>
            </select>
          )}
          {!isSelf && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={loading}
              className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100"
              title="Delete user"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          )}
          {confirmDelete && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "..." : "Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Client assignments area */}
      <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Clients
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {/* Assigned client chips */}
            {assignedClients.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-emerald-700 border border-emerald-100 transition-colors"
              >
                {c.name}
                {!isSelf && (
                  <button
                    onClick={() => handleRemoveClient(c.id)}
                    disabled={saving}
                    className="rounded-full p-0.5 transition-colors hover:bg-emerald-200/60"
                    title={`Remove ${c.name}`}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </span>
            ))}

            {/* Empty state */}
            {assignedClients.length === 0 && (
              <span className="text-xs italic text-gray-300">
                No clients assigned
              </span>
            )}

            {/* Add client button + dropdown */}
            {!isSelf && unassignedClients.length > 0 && (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  disabled={saving}
                  className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-400 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add
                  {saving && <span className="ml-0.5 animate-pulse">...</span>}
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                    <div className="max-h-48 overflow-y-auto py-1">
                      {unassignedClients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            handleToggleClient(c.id);
                            setDropdownOpen(false);
                          }}
                          disabled={saving}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-gray-50"
                        >
                          <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          <span className="truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
