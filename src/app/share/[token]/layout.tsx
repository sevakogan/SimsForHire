import { notFound } from "next/navigation";
import { getProjectByShareToken } from "@/lib/actions/projects";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const { project, client } = await getProjectByShareToken(token);

  if (!project) return { title: "Not Found" };

  return {
    title: `${project.name} — ${client?.name ?? "Portal"}`,
    description: `Client portal for ${project.name}`,
  };
}

export default async function ShareLayout({ params, children }: Props) {
  const { token } = await params;
  const { project, client } = await getProjectByShareToken(token);

  if (!project) notFound();

  return (
    <PortalSidebar
      token={token}
      clientName={client?.name ?? "Client"}
      projectName={project.name}
      invoiceNumber={project.invoice_number ?? null}
    >
      {children}
    </PortalSidebar>
  );
}
