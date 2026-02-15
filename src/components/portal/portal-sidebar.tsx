"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMPANY_INFO } from "@/lib/constants/company-info";

interface PortalSidebarProps {
  token: string;
  clientName: string;
  projectName: string;
  invoiceNumber: string | null;
  children: React.ReactNode;
}

const COLLAPSED_KEY = "portal-sidebar-collapsed";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
}

function getNavItems(token: string): NavItem[] {
  const base = `/share/${token}`;
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
      label: "Shipments",
      href: `${base}/shipments`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
    },
    {
      label: "About Us",
      href: `${base}/about`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
      ),
    },
    {
      label: "Payments",
      href: `${base}/payments`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
      ),
    },
    {
      label: "Contact Us",
      href: `${base}/contact`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      ),
    },
  ];
}

export function PortalSidebar({
  token,
  clientName,
  projectName,
  invoiceNumber,
  children,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSED_KEY);
    if (saved === "true") setCollapsed(true);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }

  const navItems = getNavItems(token);

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  const sidebarContent = (
    <>
      {/* Business card */}
      <div className={`border-b border-gray-200 px-4 py-5 ${collapsed ? "px-2 py-4" : ""}`}>
        {collapsed ? (
          <div className="flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{COMPANY_INFO.name[0]}</span>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              } ${collapsed ? "justify-center px-2" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="hidden border-t border-gray-200 p-2 sm:block">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside
        className={`hidden sm:flex sm:flex-col sm:shrink-0 bg-white border-r border-gray-200 transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile header bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 truncate">{COMPANY_INFO.name}</p>
          <p className="text-xs text-gray-500 truncate">{clientName}</p>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl animate-slide-in-left">
            {/* Close button */}
            <div className="absolute right-2 top-2">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 mt-14 sm:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
