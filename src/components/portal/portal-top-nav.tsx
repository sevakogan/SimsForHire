"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";

export function PortalTopNav() {
  const { user, profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [dropdownOpen]);

  if (!user) return null;

  const meta = user.user_metadata;
  const fullName =
    profile?.full_name ?? (meta?.full_name as string | undefined) ?? null;
  const avatarUrl =
    profile?.avatar_url ?? (meta?.avatar_url as string | undefined) ?? null;
  const email = profile?.email ?? user.email ?? "";
  const displayName = fullName ?? email;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleBadge = profile?.role === "client" ? "Customer" : profile?.role;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-end px-4 sm:px-6">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </div>
            )}
            <span className="hidden max-w-[120px] truncate text-sm font-medium text-gray-900 sm:block">
              {displayName}
            </span>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              {/* User info header */}
              <div className="border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {fullName ?? "User"}
                    </p>
                    <p className="truncate text-xs text-gray-500">{email}</p>
                  </div>
                </div>
                {roleBadge && (
                  <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                    {roleBadge}
                  </span>
                )}
              </div>

              {/* Sign out */}
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    signOut();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
