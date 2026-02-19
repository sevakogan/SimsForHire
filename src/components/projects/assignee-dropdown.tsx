"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import type { AssignableUser } from "@/lib/actions/projects";

interface AssigneeDropdownProps {
  projectId: string;
  currentAssigneeId: string | null;
  assignableUsers: AssignableUser[];
}

function UserAvatar({
  name,
  avatarUrl,
  size = "sm",
}: {
  name: string | null;
  avatarUrl: string | null;
  size?: "sm" | "md";
}) {
  const dims = size === "md" ? "h-7 w-7" : "h-5 w-5";
  const textSize = size === "md" ? "text-[10px]" : "text-[8px]";
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? ""}
        className={`${dims} rounded-full object-cover ring-1 ring-white`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`flex ${dims} items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ${textSize} font-bold text-primary ring-1 ring-white`}
    >
      {initials}
    </div>
  );
}

export function AssigneeDropdown({
  projectId,
  currentAssigneeId,
  assignableUsers,
}: AssigneeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(currentAssigneeId);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedUser = assignableUsers.find((u) => u.id === selectedId) ?? null;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  async function handleSelect(userId: string | null) {
    setSelectedId(userId);
    setOpen(false);

    startTransition(async () => {
      try {
        await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assigned_to: userId }),
        });
      } catch (err) {
        console.error("Failed to update assignee", err);
        setSelectedId(currentAssigneeId);
      }
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`group flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-all ${
          selectedUser
            ? "bg-transparent hover:bg-muted/60"
            : "border border-dashed border-gray-300 bg-transparent hover:border-primary/40 hover:bg-primary/5"
        } ${isPending ? "opacity-60 pointer-events-none" : ""}`}
      >
        {selectedUser ? (
          <>
            <UserAvatar
              name={selectedUser.full_name}
              avatarUrl={selectedUser.avatar_url}
            />
            <span className="font-medium text-foreground max-w-[120px] truncate">
              {selectedUser.full_name ?? "User"}
            </span>
            <svg
              className={`h-3 w-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4 text-gray-400 group-hover:text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
            <span className="text-gray-400 group-hover:text-primary font-medium">
              Assign
            </span>
          </>
        )}
        {isPending && (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Assign to
            </p>
          </div>

          {/* Unassign option */}
          {selectedId && (
            <button
              onClick={() => handleSelect(null)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-red-50"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="font-medium text-red-600">Unassign</span>
            </button>
          )}

          {/* Users list */}
          <div className="max-h-52 overflow-y-auto py-1">
            {assignableUsers.map((user) => {
              const isSelected = user.id === selectedId;
              return (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user.id)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-primary/5 text-primary"
                      : "text-foreground hover:bg-gray-50"
                  }`}
                >
                  <UserAvatar
                    name={user.full_name}
                    avatarUrl={user.avatar_url}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-medium ${isSelected ? "text-primary" : ""}`}>
                      {user.full_name ?? "User"}
                    </p>
                    <p className="text-[10px] capitalize text-gray-400">
                      {user.role}
                    </p>
                  </div>
                  {isSelected && (
                    <svg className="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
