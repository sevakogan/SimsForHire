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
        className={`flex items-center justify-between px-4 py-2.5 bg-red-50 ${
          showBorder ? "border-b border-red-100" : ""
        }`}
      >
        <span className="text-sm text-red-600">
          Delete <span className="font-medium">{user.full_name ?? user.email}</span>?
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className={`${buttonStyles.small} bg-red-600 text-white hover:bg-red-700`}
          >
            {loading ? "..." : "Delete"}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            disabled={loading}
            className={`${buttonStyles.small} bg-white text-muted-foreground hover:bg-muted`}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30 ${
        showBorder ? "border-b border-border/40" : ""
      }`}
    >
      {/* Name + Email */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {user.full_name ?? "--"}
          </p>
          {isSelf && (
            <span className="shrink-0 text-[10px] font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5">
              you
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>

      {/* Client name (for client users) */}
      {showClient && (
        <p className="hidden shrink-0 text-xs text-muted-foreground sm:block w-28 truncate">
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
          // Pending: Client / Employee / Decline
          <>
            <button
              onClick={handleApproveAsClient}
              disabled={loading}
              className={`${buttonStyles.small} bg-blue-50 text-blue-700 hover:bg-blue-100`}
            >
              Client
            </button>
            <button
              onClick={handleApproveAsEmployee}
              disabled={loading}
              className={`${buttonStyles.small} bg-green-50 text-green-700 hover:bg-green-100`}
            >
              Employee
            </button>
            <button
              onClick={handleDeny}
              disabled={loading}
              className={`${buttonStyles.small} bg-red-50 text-red-700 hover:bg-red-100`}
            >
              Decline
            </button>
          </>
        ) : (
          // Approved/Denied: role selector (disabled for self)
          <>
            {!isSelf && (
              <select
                onChange={handleRoleChange}
                defaultValue={user.role}
                disabled={loading}
                className={`${formStyles.select} w-auto py-1 text-xs`}
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
                className={`${formStyles.select} hidden w-auto py-1 text-xs sm:block`}
              >
                <option value="">Assign client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {/* Employee client assignment is handled by EmployeeCard */}
          </>
        )}

        {/* Delete button — always on the right, hidden for self */}
        {!isSelf && (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={loading}
            className="ml-1 rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-red-50 hover:text-red-600"
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

  const meta = user.full_name
    ? user.full_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
          {meta}
        </div>

        {/* Name + email */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.full_name ?? "--"}
            </p>
            {isSelf && (
              <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                you
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
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
              className={`${formStyles.select} w-auto py-1 text-xs`}
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
              className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-red-50 hover:text-red-600"
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
                className={`${buttonStyles.small} bg-red-600 text-white hover:bg-red-700`}
              >
                {loading ? "..." : "Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
                className={`${buttonStyles.small} bg-white text-muted-foreground hover:bg-muted`}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Client assignments area */}
      <div className="border-t border-border/50 px-4 py-3 sm:px-5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-xs font-medium text-muted-foreground">
            Clients
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {/* Assigned client chips */}
            {assignedClients.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-emerald-700 transition-colors"
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
              <span className="text-xs italic text-muted-foreground/60">
                No clients assigned
              </span>
            )}

            {/* Add client button + dropdown */}
            {!isSelf && unassignedClients.length > 0 && (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  disabled={saving}
                  className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add
                  {saving && <span className="ml-0.5 animate-pulse">...</span>}
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-white shadow-xl">
                    <div className="max-h-48 overflow-y-auto py-1">
                      {unassignedClients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            handleToggleClient(c.id);
                            setDropdownOpen(false);
                          }}
                          disabled={saving}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted/50"
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
