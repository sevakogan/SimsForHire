import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById } from "@/lib/actions/projects";
import { getItems, getItemsForClient } from "@/lib/actions/items";
import { getClientById } from "@/lib/actions/clients";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Badge } from "@/components/ui/badge";
import { buttonStyles, cardStyles } from "@/components/ui/form-styles";
import { ItemsTable } from "@/components/items/items-table";
import { InlineAddItem } from "@/components/items/inline-add-item";
import { ProjectActions } from "./project-actions";
import type { Profile, Item } from "@/types";
import { isAdminRole } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const typedProfile = profile as Profile;
  const admin = isAdminRole(typedProfile.role);

  const project = await getProjectById(id);
  if (!project) notFound();

  const client = await getClientById(project.client_id);
  const items = admin
    ? await getItems(id)
    : await getItemsForClient(id);

  const totalRetail = items.reduce(
    (sum, i) => sum + Number(i.retail_price),
    0
  );
  const totalRetailShipping = items.reduce(
    (sum, i) => sum + Number(i.retail_shipping),
    0
  );

  let totalMyCost = 0;
  let totalMyShipping = 0;
  if (admin) {
    totalMyCost = (items as Item[]).reduce(
      (sum, i) => sum + Number(i.my_cost),
      0
    );
    totalMyShipping = (items as Item[]).reduce(
      (sum, i) => sum + Number(i.my_shipping),
      0
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          {admin && client && (
            <>
              <span className="text-muted-foreground/40">›</span>
              <Link href={`/clients/${client.id}`} className="hover:text-foreground transition-colors">
                {client.name}
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{project.name}</h1>
          <Badge variant={project.status}>{project.status}</Badge>
        </div>
      </div>

      {/* Customer info header for admin */}
      {admin && client && (
        <div className={`${cardStyles.base} !p-4 sm:!p-6`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div>
              <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                Customer
              </p>
              <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                Email
              </p>
              <p className="text-sm text-foreground truncate">{client.email ?? "--"}</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                Phone
              </p>
              <p className="text-sm text-foreground">{client.phone ?? "--"}</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                Address
              </p>
              <p className="text-sm text-foreground truncate">{client.address ?? "--"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice links */}
      {(project.invoice_link || project.invoice_link_2) && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {project.invoice_link && (
            <a
              href={project.invoice_link}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles.secondary}
            >
              Invoice Link 1
            </a>
          )}
          {project.invoice_link_2 && (
            <a
              href={project.invoice_link_2}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles.secondary}
            >
              Invoice Link 2
            </a>
          )}
        </div>
      )}

      {/* Admin actions */}
      {admin && <ProjectActions project={project} />}

      {/* Invoice items */}
      <h2 className="text-base sm:text-lg font-semibold text-foreground">Invoice</h2>

      <ItemsTable items={items} projectId={id} isAdmin={admin} />

      {/* Inline add item bar */}
      {admin && <InlineAddItem projectId={id} isAdmin={admin} />}

      {/* Summary */}
      {items.length > 0 && (
        <div className={`${cardStyles.base} !p-4 sm:!p-6`}>
          <h3 className="mb-3 text-xs sm:text-sm font-semibold uppercase text-muted-foreground">
            Summary
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Retail</p>
              <p className="text-base sm:text-lg font-bold text-foreground">
                {formatCurrency(totalRetail)}
              </p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Shipping</p>
              <p className="text-base sm:text-lg font-bold text-foreground">
                {formatCurrency(totalRetailShipping)}
              </p>
            </div>
            {admin && (
              <>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Total My Cost</p>
                  <p className="text-base sm:text-lg font-bold text-foreground">
                    {formatCurrency(totalMyCost + totalMyShipping)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Est. Profit</p>
                  <p className="text-base sm:text-lg font-bold text-success">
                    {formatCurrency(
                      totalRetail + totalRetailShipping - totalMyCost - totalMyShipping
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
