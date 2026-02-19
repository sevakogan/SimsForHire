"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { COMPANY_INFO } from "@/lib/constants/company-info";
import { useTagFilterSafe } from "@/components/items/tag-filter-context";
import { getTypeColor } from "@/lib/constants/product-types";
import { getSupabaseBrowser } from "@/lib/supabase";

interface ProjectSidebarProps {
  projectId: string;
  clientName: string;
  projectName: string;
  invoiceNumber: string | null;
  contractSignedAt: string | null;
  projectStatus: string;
  children: React.ReactNode;
}

const COLLAPSED_KEY = "project-sidebar-collapsed";

/** localStorage key for tracking whether contract-signed badge has been seen */
function contractSeenKey(projectId: string): string {
  return `contract-signed-seen-${projectId}`;
}

/** localStorage key for tracking whether payment-received badge has been seen */
function paymentSeenKey(projectId: string): string {
  return `payment-received-seen-${projectId}`;
}

/** Statuses that mean "paid" */
const PAID_STATUSES = ["paid", "preparing", "shipped", "received", "completed", "archived"];

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
  /** Show a notification badge dot */
  badge?: boolean;
  /** Badge dot color: "violet" for contract, "green" for payment */
  badgeColor?: "violet" | "green";
}

function getNavItems(
  projectId: string,
  contractBadge: boolean,
  paymentBadge: boolean
): NavItem[] {
  const base = `/projects/${projectId}`;
  return [
    {
      label: "Invoice",
      href: base,
      exact: true,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
    },
    {
      label: "Contract",
      href: `${base}/contract`,
      badge: contractBadge,
      badgeColor: "violet",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
        </svg>
      ),
    },
    {
      label: "Payments",
      href: `${base}/payments`,
      badge: paymentBadge,
      badgeColor: "green",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
      ),
    },
    {
      label: "Shipments",
      href: `${base}/shipments`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
    },
  ];
}

/** Badge dot colors */
const BADGE_COLORS = {
  violet: { ping: "bg-violet-400", dot: "bg-violet-500" },
  green: { ping: "bg-green-400", dot: "bg-green-500" },
} as const;

export function ProjectSidebar({
  projectId,
  clientName,
  projectName,
  invoiceNumber,
  contractSignedAt,
  projectStatus,
  children,
}: ProjectSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Contract notification badge state
  const [contractSigned, setContractSigned] = useState(contractSignedAt !== null);
  const [contractSeen, setContractSeen] = useState(true);

  // Payment notification badge state
  const [paymentReceived, setPaymentReceived] = useState(
    PAID_STATUSES.includes(projectStatus)
  );
  const [paymentSeen, setPaymentSeen] = useState(true);

  // Load collapsed state from localStorage (default: collapsed)
  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSED_KEY);
    if (saved === "false") setCollapsed(false);
  }, []);

  // Load "seen" state from localStorage
  useEffect(() => {
    if (contractSigned) {
      const seen = localStorage.getItem(contractSeenKey(projectId));
      setContractSeen(seen === "true");
    }
  }, [contractSigned, projectId]);

  useEffect(() => {
    if (paymentReceived) {
      const seen = localStorage.getItem(paymentSeenKey(projectId));
      setPaymentSeen(seen === "true");
    }
  }, [paymentReceived, projectId]);

  // Sync server prop into local state
  useEffect(() => {
    if (contractSignedAt !== null && !contractSigned) {
      setContractSigned(true);
    }
  }, [contractSignedAt, contractSigned]);

  useEffect(() => {
    if (PAID_STATUSES.includes(projectStatus) && !paymentReceived) {
      setPaymentReceived(true);
    }
  }, [projectStatus, paymentReceived]);

  // Clear badge when user navigates to contract page
  const onContractPage = pathname.endsWith("/contract");
  useEffect(() => {
    if (onContractPage && contractSigned && !contractSeen) {
      localStorage.setItem(contractSeenKey(projectId), "true");
      setContractSeen(true);
    }
  }, [onContractPage, contractSigned, contractSeen, projectId]);

  // Clear badge when user navigates to payments page
  const onPaymentsPage = pathname.endsWith("/payments");
  useEffect(() => {
    if (onPaymentsPage && paymentReceived && !paymentSeen) {
      localStorage.setItem(paymentSeenKey(projectId), "true");
      setPaymentSeen(true);
    }
  }, [onPaymentsPage, paymentReceived, paymentSeen, projectId]);

  // ── Supabase realtime subscription for instant updates ──
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel(`project-updates-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          const newRow = payload.new as {
            contract_signed_at?: string | null;
            status?: string;
          };
          // Contract signed
          if (newRow.contract_signed_at && !contractSigned) {
            setContractSigned(true);
            setContractSeen(false);
            router.refresh();
          }
          // Payment received (status changed to paid or beyond)
          if (newRow.status && PAID_STATUSES.includes(newRow.status) && !paymentReceived) {
            setPaymentReceived(true);
            setPaymentSeen(false);
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, contractSigned, paymentReceived, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  // Show badges when event happened but not yet seen by admin
  const showContractBadge = contractSigned && !contractSeen;
  const showPaymentBadge = paymentReceived && !paymentSeen;
  const navItems = getNavItems(projectId, showContractBadge, showPaymentBadge);
  const tagCtx = useTagFilterSafe();

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  /** Handle clicking on a nav item — clear relevant badge */
  function handleNavClick(item: NavItem) {
    if (item.label === "Contract" && showContractBadge) {
      localStorage.setItem(contractSeenKey(projectId), "true");
      setContractSeen(true);
    }
    if (item.label === "Payments" && showPaymentBadge) {
      localStorage.setItem(paymentSeenKey(projectId), "true");
      setPaymentSeen(true);
    }
  }

  const sidebarContent = (
    <>
      {/* Business card + collapse toggle */}
      <div className={`border-b border-gray-200 ${collapsed ? "px-2 py-3" : "px-4 py-5"}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold text-primary">{COMPANY_INFO.name[0]}</span>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden sm:flex items-center justify-center rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Expand sidebar"
            >
              <svg className="h-3.5 w-3.5 rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">{COMPANY_INFO.name}</h1>
              <p className="mt-1.5 text-sm font-medium text-gray-700 truncate">
                {clientName}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 truncate">
                {projectName}
                {invoiceNumber && (
                  <span className="text-gray-400"> &middot; #{invoiceNumber}</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden sm:flex shrink-0 mt-0.5 items-center justify-center rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Collapse sidebar"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-0.5 px-2 py-3">
        {navItems.map((item) => {
          const active = isActive(item);
          const colors = item.badge && item.badgeColor ? BADGE_COLORS[item.badgeColor] : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item)}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              } ${collapsed ? "justify-center px-2" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="relative shrink-0">
                {item.icon}
                {/* Notification dot on icon (collapsed mode) */}
                {item.badge && collapsed && colors && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.ping} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors.dot}`} />
                  </span>
                )}
              </span>
              {!collapsed && (
                <span className="flex items-center gap-2">
                  {item.label}
                  {/* Notification dot to the right of label */}
                  {item.badge && colors && (
                    <span className="flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full ${colors.ping} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors.dot}`} />
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Tag filter pills */}
      {tagCtx && tagCtx.tags.length > 0 && (
        <div className={`border-t border-gray-200 px-2 py-3 ${collapsed ? "px-1" : ""}`}>
          {!collapsed && (
            <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Tags
            </p>
          )}
          <div className={collapsed ? "space-y-1" : "flex flex-wrap gap-1.5 px-1"}>
            <button
              type="button"
              onClick={() => tagCtx.setTagFilter("")}
              className={`${collapsed ? "flex w-full items-center justify-center rounded-md p-1.5" : "rounded-full px-2.5 py-0.5"} text-[11px] font-medium transition-all ${
                tagCtx.tagFilter === ""
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
              title={collapsed ? `All (${tagCtx.totalItems})` : undefined}
            >
              {collapsed ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
                </svg>
              ) : (
                <>All ({tagCtx.totalItems})</>
              )}
            </button>
            {tagCtx.tags.map(([tag, count]) => {
              const colors = getTypeColor(tag);
              const tagActive = tagCtx.tagFilter === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => tagCtx.setTagFilter(tagActive ? "" : tag)}
                  className={`${collapsed ? "flex w-full items-center justify-center rounded-md p-1.5" : "rounded-full px-2.5 py-0.5"} text-[11px] font-medium transition-all ${
                    tagActive
                      ? `${colors.activeBg} ${colors.activeText} shadow-sm`
                      : `${colors.bg} ${colors.text} hover:opacity-80`
                  }`}
                  title={collapsed ? `${tag} (${count})` : undefined}
                >
                  {collapsed ? (
                    <span className="text-[10px]">{tag.charAt(0).toUpperCase()}</span>
                  ) : (
                    <>
                      {tag}
                      <span className={`ml-1 text-[10px] ${tagActive ? "opacity-80" : "opacity-60"}`}>
                        {count}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacer to push back link to bottom */}
      <div className="flex-1" />

      {/* Back to projects link */}
      <div className="border-t border-gray-200 px-2 py-2">
        <Link
          href="/projects"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 ${
            collapsed ? "justify-center px-2" : ""
          }`}
          title={collapsed ? "All Projects" : undefined}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          {!collapsed && <span>All Projects</span>}
        </Link>
      </div>

      {/* Build footer */}
      {!collapsed && (
        <div className="border-t border-gray-200 px-4 py-2.5">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Designed by TheLevelTeam LLC
          </p>
          <p className="text-[10px] text-gray-400">
            Built: #{process.env.NEXT_PUBLIC_BUILD_NUMBER}, Version {process.env.NEXT_PUBLIC_APP_VERSION}
          </p>
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Desktop sidebar */}
      <aside
        className={`hidden sm:flex sm:flex-col sm:shrink-0 bg-white border-r border-gray-200 rounded-l-xl transition-all duration-200 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile nav tabs */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-gray-200 bg-white sm:hidden">
        {navItems.map((item) => {
          const active = isActive(item);
          const colors = item.badge && item.badgeColor ? BADGE_COLORS[item.badgeColor] : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors ${
                active ? "text-primary" : "text-gray-400"
              }`}
            >
              <span className="relative shrink-0">
                {item.icon}
                {item.badge && colors && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.ping} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors.dot}`} />
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-16 sm:pb-0">
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
