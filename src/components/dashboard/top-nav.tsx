"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";

const navTabs = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Clients", href: "/clients" },
  { label: "Projects", href: "/projects" },
];

export function TopNav() {
  const pathname = usePathname();
  const { user, profile, signOut, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Close dropdown on outside click — use "click" (not "mousedown")
  // so that button clicks inside the dropdown fire before it closes
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [dropdownOpen]);

  // Use profile data first, fall back to Google OAuth user metadata
  const meta = user?.user_metadata;
  const fullName = profile?.full_name ?? (meta?.full_name as string | undefined) ?? null;
  const avatarUrl = profile?.avatar_url ?? (meta?.avatar_url as string | undefined) ?? null;
  const email = profile?.email ?? user?.email ?? "";
  const displayName = fullName ?? email;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>

          <Link href="/dashboard" className="text-lg font-bold text-foreground">
            SimsForHire
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex">
            {navTabs.map((tab) => {
              const isActive =
                pathname === tab.href ||
                (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
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
            <span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground sm:block">
              {displayName}
            </span>
            <svg
              className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
              {/* User info header */}
              <div className="border-b border-border px-4 py-3">
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
                    <p className="truncate text-sm font-semibold text-foreground">
                      {fullName ?? "User"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {email}
                    </p>
                  </div>
                </div>
                {profile?.role && (
                  <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                    {profile.role}
                  </span>
                )}
              </div>

              {/* Menu items */}
              <div className="py-1">
                <DropdownLink
                  href="/profile"
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  }
                  label="My Profile"
                />

                <DropdownLink
                  href="/catalog"
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  }
                  label="Products"
                  description="Product catalog"
                />

                {isAdmin && (
                  <DropdownLink
                    href="/customizations"
                    icon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                      </svg>
                    }
                    label="Customizations"
                    description="Sellers & settings"
                  />
                )}

                {isAdmin && (
                  <DropdownLink
                    href="/admin"
                    icon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                      </svg>
                    }
                    label="Admin"
                    description="Manage company users"
                  />
                )}
              </div>

              {/* Sign out */}
              <div className="border-t border-border py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    signOut();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <nav className="border-t border-border bg-white px-4 pb-3 pt-2 sm:hidden">
          <div className="space-y-1">
            {navTabs.map((tab) => {
              const isActive =
                pathname === tab.href ||
                (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-2 border-t border-border/50 pt-2">
            <p className="px-3 py-1 text-xs text-muted-foreground truncate">
              {fullName ?? email}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                signOut();
              }}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

function DropdownLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted"
    >
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </Link>
  );
}
