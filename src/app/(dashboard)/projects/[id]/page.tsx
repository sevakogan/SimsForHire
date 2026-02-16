import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/actions/projects";
import { getItems, getItemsForClient, getUnreadNoteCount } from "@/lib/actions/items";
import { getClientById } from "@/lib/actions/clients";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/form-styles";
import { ItemsTable } from "@/components/items/items-table";
import { InlineAddItem } from "@/components/items/inline-add-item";
import { ProjectActions } from "./project-actions";
import { InvoiceDiscountProvider, InvoiceSection, LiveInvoiceFooter } from "./invoice-section";
import { EditableProjectName } from "./editable-project-name";
import type { Profile, Item, DiscountType } from "@/types";
import { isAdminRole } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
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
  const [items, noteCount] = await Promise.all([
    admin ? getItems(id) : getItemsForClient(id),
    admin ? getUnreadNoteCount(id) : Promise.resolve(0),
  ]);

  // Split retail totals by category: products vs services
  const totalRetail = items.reduce(
    (sum, i) => {
      const cat = (i as Item).category ?? "product";
      return cat === "service" ? sum : sum + Number(i.retail_price) * (i.quantity ?? 1);
    },
    0
  );
  const totalServiceRetail = items.reduce(
    (sum, i) => {
      const cat = (i as Item).category ?? "product";
      return cat === "service" ? sum + Number(i.retail_price) * (i.quantity ?? 1) : sum;
    },
    0
  );
  const totalRetailShipping = items.reduce(
    (sum, i) => sum + Number(i.retail_shipping) * (i.quantity ?? 1),
    0
  );
  // Services total = service-category item prices + all shipping
  const totalServices = totalServiceRetail + totalRetailShipping;

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

  const projDiscountType = (project.discount_type ?? "percent") as DiscountType;

  return (
    <InvoiceDiscountProvider
      discountType={projDiscountType}
      discountPercent={Number(project.discount_percent) || 0}
      discountAmount={Number(project.discount_amount) || 0}
      taxPercent={Number(project.tax_percent) || 0}
    >
    <div className="space-y-4 sm:space-y-6">
      {/* Header: status + share on top, name below */}
      <div>
        {admin && (
          <div className="flex items-center justify-between mb-2">
            <ProjectActions project={project} />
          </div>
        )}
        <div className="flex items-center gap-2 sm:gap-3">
          <EditableProjectName projectId={project.id} name={project.name} isAdmin={admin} />
          {!admin && <Badge variant={project.status}>{project.status}</Badge>}
        </div>
        {!admin && project.invoice_number && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Invoice #{project.invoice_number}
          </p>
        )}
      </div>

      {/* Side-by-side: Customer card (30%) + Invoice card (70%) — admin only */}
      {admin && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Customer info card — compact, pretty */}
          {client && (
            <div className="w-full lg:w-[30%] lg:min-w-[240px]">
              <div className="h-full rounded-2xl border border-gray-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 shadow-sm overflow-hidden">
                {/* Accent bar */}
                <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />

                <div className="p-4 sm:p-5 space-y-4">
                  {/* Client avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                      <span className="text-sm font-bold text-white">
                        {(client.name || "C").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {client.name}
                      </h3>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        Customer
                      </p>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-2.5">
                    {client.email && (
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                          <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-600 truncate">{client.email}</span>
                      </div>
                    )}

                    {client.phone && (
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50">
                          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-600">{client.phone}</span>
                      </div>
                    )}

                    {client.address && (
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                          <svg className="h-3.5 w-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-600 leading-relaxed">{client.address}</span>
                      </div>
                    )}

                    {!client.email && !client.phone && !client.address && (
                      <p className="text-xs text-gray-400 italic">No contact details</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice info card — 70% width */}
          <div className={`w-full ${client ? "lg:w-[70%]" : ""}`}>
            <InvoiceSection
              projectId={project.id}
              invoiceNumber={project.invoice_number}
              dateRequired={project.date_required}
              fulfillmentType={project.fulfillment_type}
              notes={project.notes ?? ""}
              taxPercent={Number(project.tax_percent) || 0}
              discountPercent={Number(project.discount_percent) || 0}
              discountType={projDiscountType}
              discountAmount={Number(project.discount_amount) || 0}
              itemsTotal={totalRetail}
              deliveryTotal={totalServices}
              myCost={totalMyCost}
              myShipping={totalMyShipping}
            />
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

      {/* Invoice Summary Footer — live-synced with discount changes */}
      {items.length > 0 && (
        <LiveInvoiceFooter
          itemsTotal={totalRetail}
          deliveryTotal={totalServices}
          discountType={projDiscountType}
          discountPercent={Number(project.discount_percent) || 0}
          discountAmount={Number(project.discount_amount) || 0}
          taxPercent={Number(project.tax_percent) || 0}
          myCost={admin ? totalMyCost : undefined}
          myShipping={admin ? totalMyShipping : undefined}
        />
      )}
    </div>
    </InvoiceDiscountProvider>
  );
}
