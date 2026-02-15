"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  approveUser,
  denyUser,
  assignClientToUser,
  updateUserRole,
  deleteUser,
} from "@/lib/actions/users";
import { buttonStyles, formStyles } from "@/components/ui/form-styles";
import type { ProfileWithClient } from "@/lib/actions/users";
import type { Client, UserRole } from "@/types";

interface Props {
  user: ProfileWithClient;
  clients: Client[];
}

export function UserActions({ user, clients }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleApprove() {
    setLoading(true);
    await approveUser(user.id);
    router.refresh();
    setLoading(false);
  }

  async function handleDeny() {
    setLoading(true);
    await denyUser(user.id);
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

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as UserRole;
    setLoading(true);
    await updateUserRole(user.id, role);
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

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600">Delete user?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className={`${buttonStyles.small} bg-destructive/10 text-red-700 hover:bg-destructive/20`}
        >
          {loading ? "..." : "Yes"}
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          disabled={loading}
          className={`${buttonStyles.small} bg-muted text-muted-foreground hover:bg-muted/80`}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {user.status === "pending" && (
        <>
          <button
            onClick={handleApprove}
            disabled={loading}
            className={`${buttonStyles.small} bg-success/10 text-green-700 hover:bg-success/20`}
          >
            Approve
          </button>
          <button
            onClick={handleDeny}
            disabled={loading}
            className={`${buttonStyles.small} bg-destructive/10 text-red-700 hover:bg-destructive/20`}
          >
            Deny
          </button>
        </>
      )}

      <select
        onChange={handleRoleChange}
        defaultValue={user.role}
        disabled={loading}
        className={`${formStyles.select} w-auto py-1 text-xs`}
      >
        <option value="client">client</option>
        <option value="collaborator">collaborator</option>
        <option value="admin">admin</option>
      </select>

      {user.role === "client" && (
        <select
          onChange={handleAssignClient}
          defaultValue={user.client_id ?? ""}
          disabled={loading}
          className={`${formStyles.select} w-auto py-1 text-xs`}
        >
          <option value="">Assign client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={() => setConfirmDelete(true)}
        disabled={loading}
        className={`${buttonStyles.small} text-muted-foreground hover:text-red-600 hover:bg-red-50`}
        title="Delete user"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </button>
    </div>
  );
}
