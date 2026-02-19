import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Profile, Project } from "@/types";

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const typedProfile = profile as Profile;

  if (!typedProfile.client_id) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Welcome</h1>
          <p className="mt-2 text-sm text-gray-500">
            Your account has not been linked to a client profile yet.
            Please contact the admin.
          </p>
        </div>
      </div>
    );
  }

  // Fetch client info + their projects (using admin to bypass RLS)
  const adminDb = getAdminSupabase();

  const [clientRes, projectsRes] = await Promise.all([
    adminDb
      .from("clients")
      .select("id, name, email, phone")
      .eq("id", typedProfile.client_id)
      .single(),
    adminDb
      .from("projects")
      .select("*")
      .eq("client_id", typedProfile.client_id)
      .neq("status", "draft")
      .order("created_at", { ascending: false }),
  ]);

  const client = clientRes.data;
  const projects = (projectsRes.data ?? []) as Project[];

  // Customer-friendly status labels
  const statusLabels: Record<string, string> = {
    quote: "Quote Ready",
    submitted: "Submitted",
    accepted: "Accepted",
    paid: "Paid",
    preparing: "In Progress",
    shipped: "Shipped",
    received: "Received",
    completed: "Completed",
    archived: "Archived",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          My Projects
        </h1>
        {client && (
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, <span className="font-medium text-gray-700">{client.name}</span>
          </p>
        )}
      </div>

      {/* Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Projects</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{projects.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Active</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {projects.filter((p) =>
                !["completed", "archived"].includes(p.status)
              ).length}
            </p>
          </div>
          <div className="hidden sm:block rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Completed</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {projects.filter((p) => p.status === "completed").length}
            </p>
          </div>
        </div>
      )}

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">No projects yet.</p>
          <p className="mt-1 text-xs text-gray-400">Your projects will appear here once created.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const hasShareLink = !!project.share_token;
            const href = hasShareLink
              ? `/share/${project.share_token}`
              : "#";

            return (
              <Link
                key={project.id}
                href={href}
                className={`flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all sm:p-5 ${
                  hasShareLink
                    ? "hover:border-primary/20 hover:shadow-md"
                    : "cursor-default opacity-70"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate sm:text-base">
                      {project.name}
                    </p>
                    {project.invoice_number && (
                      <span className="hidden text-xs text-gray-400 sm:inline">
                        #{project.invoice_number}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {new Date(project.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {project.date_required && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                        Due {new Date(project.date_required).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 ml-3">
                  <Badge variant={project.status}>
                    {statusLabels[project.status] ?? project.status}
                  </Badge>
                  {hasShareLink && (
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
