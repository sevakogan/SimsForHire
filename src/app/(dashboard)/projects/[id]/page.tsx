import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById } from "@/lib/actions/projects";
import { getItems, getItemsForClient, getUnreadNoteCount } from "@/lib/actions/items";
import { getClientById } from "@/lib/actions/clients";
import { getShipmentsByProjectId } from "@/lib/actions/shipments";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Badge } from "@/components/ui/badge";
import { buttonStyles, cardStyles } from "@/components/ui/form-styles";
import { ItemsTable } from "@/components/items/items-table";
import { InlineAddItem } from "@/components/items/inline-add-item";
import { ProjectActions } from "./project-actions";
import { ShipmentsSection } from "./shipments-section";
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
  const [items, noteCount, shipments] = await Promise.all([
    admin ? getItems(id) : getItemsForClient(id),
    admin ? getUnreadNoteCount(id) : Promise.resolve(0),
    admin ? getShipmentsByProjectId(id) : Promise.resolve([]),
  ]);

  const totalRetail = items.reduce(
    (sum, i) => sum + Number(i.retail_price) * (i.quantity ?? 1),
    0
  );
  const totalRetailShipping = items.reduce(
    (sum, i) => sum + Number(i.retail_shipping) * (i.quantity ?? 1),
    0
  );

  let totalMyCost = 0;
  let totalMyShipping = 0;
  if (admin) {
    totalMyCost = (items as Item[]).reduce(
      (sum, i) => sum + Number(i.my_cost) * (i.quantity ?? 1),
      0
    );
    totalMyShipping = (items as Item[]).reduce(
      (sum, i) => sum + Number(i.my_shipping) * (i.quantity ?? 1),
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
        {!admin && project.invoice_number && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Invoice #{project.invoice_number}
          </p>
        )}
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

      {/* Invoice number card — admin */}
      {admin && (
        <div className={`${cardStyles.base} !p-4 sm:!p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                Invoice Number
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {project.invoice_number || <span className="text-muted-foreground/50 font-normal">Not set</span>}
              </p>
            </div>
            {project.date_required && (
              <div className="text-right">
                <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                  Required By
                </p>
                <p className="text-sm text-foreground mt-0.5">
                  {new Date(project.date_required).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className="text-right">
              <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                Fulfillment
              </p>
              <p className="text-sm text-foreground mt-0.5 capitalize">
                {project.fulfillment_type}
              </p>
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
      <div className="flex items-center gap-2">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Invoice</h2>
        {admin && noteCount > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[18px] leading-none">
            {noteCount}
          </span>
        )}
      </div>

      <ItemsTable items={items} projectId={id} isAdmin={admin} unreadNoteCount={noteCount} />

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

      {/* Shipments */}
      {admin && (
        <ShipmentsSection projectId={id} shipments={shipments} />
      )}
    </div>
  );
}
