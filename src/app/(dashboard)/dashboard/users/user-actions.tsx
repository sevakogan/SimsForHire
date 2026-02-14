"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  approveUser,
  denyUser,
  assignClientToUser,
  updateUserRole,
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
    </div>
  );
}
