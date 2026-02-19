import { notFound } from "next/navigation";
import Link from "next/link";
import { getClientById } from "@/lib/actions/clients";
import { getProjects } from "@/lib/actions/projects";
import { getUnreadNoteCountsByProjects } from "@/lib/actions/items";
import { ClientDetailClient } from "./client-detail-client";
import { ProjectsSection } from "./projects-section";
import { cardStyles } from "@/components/ui/form-styles";

interface Props {
  params: Promise<{ id: string }>;
}

/** Turn an instagram value into a full URL */
function instagramUrl(value: string): string {
  if (value.startsWith("http")) return value;
  const handle = value.replace(/^@/, "");
  return `https://instagram.com/${handle}`;
}

/** Turn a website value into a full URL */
function ensureUrl(value: string): string {
  if (value.startsWith("http")) return value;
  return `https://${value}`;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) notFound();

  const projects = await getProjects({ clientId: id });
  const projectIds = projects.map((p) => p.id);
  const noteCountsMap = await getUnreadNoteCountsByProjects(projectIds);

  const noteCounts: Record<string, number> = {};
  noteCountsMap.forEach((count, projectId) => {
    noteCounts[projectId] = count;
  });

  const hasCompanyInfo = client.company_name || client.company_phone || client.company_email || client.website || client.instagram;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </div>
        <h1 className="text-lg sm:text-2xl font-bold text-foreground">{client.name}</h1>
      </div>

      <div className={`${cardStyles.base} !p-4 sm:!p-6`}>
        {/* Personal details */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Email
            </p>
            {client.email ? (
              <a href={`mailto:${client.email}`} className="text-sm text-primary hover:underline truncate block">
                {client.email}
              </a>
            ) : (
              <p className="text-sm text-foreground">--</p>
            )}
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Phone
            </p>
            {client.phone ? (
              <a href={`tel:${client.phone}`} className="text-sm text-primary hover:underline">
                {client.phone}
              </a>
            ) : (
              <p className="text-sm text-foreground">--</p>
            )}
          </div>
          <div className="col-span-2">
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Address
            </p>
            <p className="text-sm text-foreground truncate">{client.address ?? "--"}</p>
          </div>
        </div>

        {/* Company info section */}
        {hasCompanyInfo && (
          <>
            <div className="border-t border-gray-100 my-4" />
            <p className="mb-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
              Company
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {client.company_name && (
                <div>
                  <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                    Company Name
                  </p>
                  <p className="text-sm font-medium text-foreground">{client.company_name}</p>
                </div>
              )}
              {client.company_phone && (
                <div>
                  <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                    Company Phone
                  </p>
                  <a href={`tel:${client.company_phone}`} className="text-sm text-primary hover:underline">
                    {client.company_phone}
                  </a>
                </div>
              )}
              {client.company_email && (
                <div>
                  <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                    Company Email
                  </p>
                  <a href={`mailto:${client.company_email}`} className="text-sm text-primary hover:underline truncate block">
                    {client.company_email}
                  </a>
                </div>
              )}
              {client.website && (
                <div>
                  <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                    Website
                  </p>
                  <a
                    href={ensureUrl(client.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate block"
                  >
                    {client.website}
                  </a>
                </div>
              )}
              {client.instagram && (
                <div>
                  <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                    Instagram
                  </p>
                  <a
                    href={instagramUrl(client.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-pink-600 hover:text-pink-700 hover:underline transition-colors"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    {client.instagram.startsWith("http")
                      ? client.instagram.split("/").pop()
                      : client.instagram}
                  </a>
                </div>
              )}
            </div>
          </>
        )}

        <ClientDetailClient client={client} />
      </div>

      <ProjectsSection
        projects={projects}
        clientId={id}
        noteCounts={noteCounts}
      />
    </div>
  );
}
