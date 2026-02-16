import { notFound } from "next/navigation";
import { getProjectByShareToken } from "@/lib/actions/projects";
import { getCompanyInfo } from "@/lib/actions/company-info";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const [{ project, client }, company] = await Promise.all([
    getProjectByShareToken(token),
    getCompanyInfo(),
  ]);

  if (!project) return { title: "Not Found" };

  const companyName = company.name || "SimsForHire";
  const tagline = company.tagline || "Premium sourcing & white-glove delivery";
  const title = `${project.name} — ${client?.name ?? "Portal"}`;
  const description = `${companyName}: ${tagline}. View your project portal for ${project.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: companyName,
      type: "website",
      images: [`/api/og/${token}`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/${token}`],
    },
  };
}

export default async function ShareLayout({ params, children }: Props) {
  const { token } = await params;
  const [{ project, client }, company] = await Promise.all([
    getProjectByShareToken(token),
    getCompanyInfo(),
  ]);

  if (!project) notFound();

  return (
    <PortalSidebar
      token={token}
      clientName={client?.name ?? "Client"}
      projectName={project.name}
      invoiceNumber={project.invoice_number ?? null}
      companyName={company.name}
    >
      {children}
    </PortalSidebar>
  );
}
