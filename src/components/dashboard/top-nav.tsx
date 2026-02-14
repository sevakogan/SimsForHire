"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";

const adminTabs = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Clients", href: "/clients" },
  { label: "Products", href: "/catalog" },
  { label: "Users", href: "/dashboard/users" },
];

const clientTabs = [{ label: "My Quotes", href: "/dashboard" }];

export function TopNav() {
  const pathname = usePathname();
  const { profile, signOut, isAdmin } = useAuth();

  const tabs = isAdmin ? adminTabs : clientTabs;

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-lg font-bold text-foreground">
            SimsForHire
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {tabs.map((tab) => {
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

        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-2">
              {profile.avatar_url && (
                <Image
                  src={profile.avatar_url}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="hidden text-sm font-medium text-foreground sm:block">
                {profile.full_name ?? profile.email}
              </span>
            </div>
          )}
          <button
            onClick={signOut}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
