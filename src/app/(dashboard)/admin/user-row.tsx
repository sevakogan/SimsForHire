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
  showEmployeeClients?: boolean;
  showBorder?: boolean;
}

export function UserRow({
  user,
  clients,
  currentUserId,
  isPending,
  showClient,
  showEmployeeClients,
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

            {!isSelf && user.role === "employee" && showEmployeeClients && (
              <EmployeeClientAssigner
                userId={user.id}
                clients={clients}
                assignedClientIds={user.assigned_client_ids ?? []}
              />
            )}
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

/* ── Multi-client assignment dropdown for employee users ── */

function EmployeeClientAssigner({
  userId,
  clients,
  assignedClientIds,
}: {
  userId: string;
  clients: Client[];
  assignedClientIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedClientIds));
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  async function handleToggle(clientId: string) {
    const newSelected = new Set(selected);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelected(newSelected);
    setSaving(true);
    await assignClientsToEmployee(userId, [...newSelected]);
    router.refresh();
    setSaving(false);
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen(!open)}
        className={`${formStyles.select} w-auto py-1 text-xs inline-flex items-center gap-1`}
      >
        <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
        {selected.size} client{selected.size !== 1 ? "s" : ""}
        {saving && <span className="text-muted-foreground">...</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 max-h-48 overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
          {clients.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No clients</p>
          )}
          {clients.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => handleToggle(c.id)}
                disabled={saving}
                className="rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <span className="text-xs text-foreground truncate">{c.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
