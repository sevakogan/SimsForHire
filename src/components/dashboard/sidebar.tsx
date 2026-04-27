"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";
import { NotificationBell } from "./notification-bell";
import versionData from "../../../version.json";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    internalOnly: false,
    icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  },
  {
    id: "events",
    label: "Events",
    internalOnly: true,
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    // Group: parent label is a section header; children render indented below
    children: [
      { id: "events-list", label: "Events", href: "/events" },
      { id: "events-qr", label: "QR Code", href: "/qr-codes" },
    ],
  },
  {
    id: "signers",
    label: "Leads",
    href: "/signers",
    internalOnly: true,
    icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  },
  {
    id: "leads",
    label: "Leads",
    href: "/leads",
    internalOnly: true,
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  },
  {
    id: "clients",
    label: "Clients",
    href: "/clients",
    internalOnly: true,
    icon: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z",
  },
  {
    id: "projects",
    label: "Projects",
    href: "/projects",
    internalOnly: false,
    icon: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
  },
  {
    id: "marketing",
    label: "Marketing",
    href: "/marketing",
    internalOnly: true,
    icon: "M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46",
  },
  {
    id: "jobs",
    label: "Jobs",
    href: "/jobs",
    internalOnly: true,
    icon: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z",
  },
  {
    id: "blog",
    label: "Blog",
    href: "/blog",
    internalOnly: true,
    icon: "M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z",
  },
];

const ADMIN_ONLY_ITEMS = [
  {
    id: "admin",
    label: "Admin",
    href: "/admin",
    icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  },
];

function NavIcon({ path, active }: { path: string; active: boolean }) {
  return (
    <svg
      style={{ width: 18, height: 18, color: active ? "#E10600" : "#AEAEB2" }}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile, signOut, isAdmin, isInternal } = useAuth();

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

  const builtAt =
    "builtAt" in versionData
      ? new Date((versionData as { builtAt: string }).builtAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null;

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.internalOnly || isInternal
  );

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex flex-col"
      style={{
        width: 240,
        background: "#FBFBFD",
        borderRight: "1px solid #E5E5E7",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "28px 24px 24px",
          borderBottom: "1px solid #E5E5E7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: "#1D1D1F",
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "white", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px" }}>
              S4H
            </span>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", letterSpacing: "-0.2px" }}>
              SimsForHire
            </p>
            <p style={{ fontSize: 10, color: "#AEAEB2", letterSpacing: "0.5px" }}>ADMIN</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "#AEAEB2",
            letterSpacing: "1px",
            textTransform: "uppercase",
            padding: "0 12px 8px",
          }}
        >
          Menu
        </p>

        {visibleItems.map((item) => {
          // Group with children: render header (non-clickable) + nested links
          if ("children" in item && item.children) {
            const anyChildActive = item.children.some((c) => isActive(c.href));
            return (
              <div key={item.id} style={{ marginBottom: 4 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    fontSize: 14,
                    fontWeight: anyChildActive ? 500 : 400,
                    color: anyChildActive ? "#1D1D1F" : "#86868B",
                  }}
                >
                  <NavIcon path={item.icon} active={anyChildActive} />
                  {item.label}
                </div>
                <div style={{ marginLeft: 16, marginTop: 2 }}>
                  {item.children.map((child) => {
                    const childActive = isActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: childActive ? 500 : 400,
                          color: childActive ? "#1D1D1F" : "#86868B",
                          background: childActive ? "rgba(0,0,0,0.04)" : "transparent",
                          textDecoration: "none",
                          marginBottom: 2,
                          transition: "all 0.15s",
                          borderLeft: "2px solid",
                          borderLeftColor: childActive ? "#E10600" : "rgba(0,0,0,0.06)",
                          paddingLeft: 12,
                        }}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }
          // Regular item (must have href)
          if (!item.href) return null;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: active ? 500 : 400,
                color: active ? "#1D1D1F" : "#86868B",
                background: active ? "rgba(0,0,0,0.04)" : "transparent",
                textDecoration: "none",
                marginBottom: 2,
                transition: "all 0.15s",
              }}
            >
              <NavIcon path={item.icon} active={active} />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <p
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "#AEAEB2",
                letterSpacing: "1px",
                textTransform: "uppercase",
                padding: "12px 12px 8px",
              }}
            >
              System
            </p>
            {ADMIN_ONLY_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: active ? 500 : 400,
                    color: active ? "#1D1D1F" : "#86868B",
                    background: active ? "rgba(0,0,0,0.04)" : "transparent",
                    textDecoration: "none",
                    marginBottom: 2,
                    transition: "all 0.15s",
                  }}
                >
                  <NavIcon path={item.icon} active={active} />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid #E5E5E7" }}>
        {/* User row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 10,
            marginBottom: 2,
          }}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={28}
              height={28}
              style={{ borderRadius: "50%", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                background: "#E10600",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                color: "white",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#1D1D1F",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fullName ?? "User"}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#AEAEB2",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {email}
            </p>
          </div>
        </div>

        <Link
          href="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 13,
            color: "#86868B",
            textDecoration: "none",
            marginBottom: 2,
            transition: "all 0.15s",
          }}
        >
          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Profile
        </Link>

        <button
          onClick={signOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 13,
            color: "#86868B",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "100%",
            fontFamily: "inherit",
            transition: "all 0.15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#E10600")}
          onMouseOut={(e) => (e.currentTarget.style.color = "#86868B")}
        >
          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Sign Out
        </button>

        <a
          href="https://simsforhire.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 12px",
            fontSize: 12,
            color: "#AEAEB2",
            textDecoration: "none",
            transition: "all 0.15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#86868B")}
          onMouseOut={(e) => (e.currentTarget.style.color = "#AEAEB2")}
        >
          ← Back to website
        </a>

        {/* Build info */}
        <div style={{ padding: "6px 12px", marginTop: 4 }}>
          <p style={{ fontSize: 10, color: "#AEAEB2", letterSpacing: "0.5px", lineHeight: 1.6, opacity: 0.7 }}>
            v{versionData.version} · build #{versionData.build}
            {builtAt && <><br />{builtAt}</>}
          </p>
        </div>
      </div>
    </aside>
  );
}
