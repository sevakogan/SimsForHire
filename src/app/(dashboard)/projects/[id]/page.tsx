import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById } from "@/lib/actions/projects";
import { getItems, getItemsForClient, getUnreadNoteCount } from "@/lib/actions/items";
import { getClientById } from "@/lib/actions/clients";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/form-styles";
import { ItemsWithSidebar } from "./items-with-sidebar";
import { InlineAddItem } from "@/components/items/inline-add-item";
import { ProjectActions } from "./project-actions";
import { InvoiceDiscountProvider, InvoiceSection, LiveInvoiceFooter } from "./invoice-section";
import { EditableProjectName } from "./editable-project-name";
import { EditableCustomerCard } from "./editable-customer-card";
import { EditInvoiceButton } from "./edit-invoice-button";
import { isEditLocked, isContractLocked } from "@/lib/constants/project-statuses";
import type { Profile, Item, DiscountType } from "@/types";
import { isAdminRole, isEmployeeRole } from "@/types";

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
  const employee = isEmployeeRole(typedProfile.role);
  const canEdit = admin || employee;

  const project = await getProjectById(id);
  if (!project) notFound();

  // Lock editing once submitted (customer is viewing the invoice)
  // Once contract is signed, invoice is permanently locked — no escape-hatch
  const contractLocked = isContractLocked(project.contract_signed_at);
  const editLocked = canEdit && (isEditLocked(project.status) || contractLocked);

  const client = await getClientById(project.client_id);

  // Fetch creator profile (for "Created by" display)
  let creator: { full_name: string | null; avatar_url: string | null } | null = null;
  if (project.created_by) {
    const { data: creatorProfile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", project.created_by)
      .single();
    creator = creatorProfile;
  }

  const [items, noteCount] = await Promise.all([
    admin ? getItems(id) : getItemsForClient(id),
    canEdit ? getUnreadNoteCount(id) : Promise.resolve(0),
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
      additionalDiscount={Number(project.additional_discount) || 0}
      taxPercent={Number(project.tax_percent) || 0}
      fulfillmentType={project.fulfillment_type}
    >
    <div className="space-y-4 sm:space-y-6">
      {/* Back navigation */}
      {canEdit && (
        <div className="flex items-center gap-3 text-xs">
          {client && (
            <Link
              href={`/clients/${project.client_id}`}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Back to Customer
            </Link>
          )}
          {client && (
            <span className="text-gray-300">|</span>
          )}
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Projects
          </Link>
        </div>
      )}

      {/* Header: status + share on top, name below */}
      <div>
        {canEdit && (
          <div className="flex items-center justify-between mb-2">
            <ProjectActions project={project} />
          </div>
        )}
        <div className="flex items-center gap-2 sm:gap-3">
          <EditableProjectName projectId={project.id} name={project.name} isAdmin={admin} readOnly={editLocked || employee} />
          {!canEdit && <Badge variant={project.status}>{project.status}</Badge>}
        </div>
        {/* Created by */}
        {creator && canEdit && (
          <div className="flex items-center gap-2 mt-1.5">
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={creator.full_name ?? "Creator"}
                className="h-5 w-5 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[9px] font-semibold text-gray-500">
                {(creator.full_name ?? "?")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              Created by <span className="font-medium text-foreground">{creator.full_name ?? "Unknown"}</span>
            </span>
          </div>
        )}
        {!canEdit && project.invoice_number && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Invoice #{project.invoice_number}
          </p>
        )}
      </div>

      {/* Side-by-side: Customer card (30%) + Invoice card (70%) — internal users */}
      {canEdit && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Customer info card — editable, with conditional shipping/delivery address */}
          {client && (
            <div className="w-full lg:w-[30%] lg:min-w-[240px]">
              <EditableCustomerCard
                clientId={client.id}
                projectId={project.id}
                name={client.name}
                email={client.email}
                phone={client.phone}
                address={client.address}
                shippingAddress={project.shipping_address ?? ""}
                readOnly={editLocked || employee}
              />
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
              additionalDiscount={Number(project.additional_discount) || 0}
              itemsTotal={totalRetail}
              deliveryTotal={totalServices}
              myCost={admin ? totalMyCost : undefined}
              myShipping={admin ? totalMyShipping : undefined}
              readOnly={editLocked || employee}
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
        {canEdit && noteCount > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[18px] leading-none">
            {noteCount}
          </span>
        )}
      </div>

      <ItemsWithSidebar items={items} projectId={id} isAdmin={admin} canEdit={admin} unreadNoteCount={noteCount} readOnly={editLocked} />

      {/* Inline add item bar — admin only, hidden when invoice is locked */}
      {admin && !editLocked && <InlineAddItem projectId={id} isAdmin={admin} />}

      {/* Edit The Invoice button — shown when invoice is locked (accepted+) but NOT when contract is signed */}
      {admin && editLocked && !contractLocked && <EditInvoiceButton projectId={id} />}

      {/* Contract-locked notice — shown when contract is signed */}
      {admin && contractLocked && (
        <div className="flex items-center gap-2.5 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs text-violet-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <span>Invoice is locked — the purchase agreement has been signed.</span>
        </div>
      )}

      {/* Invoice Summary Footer — live-synced with discount changes */}
      {items.length > 0 && (
        <LiveInvoiceFooter
          itemsTotal={totalRetail}
          deliveryTotal={totalServices}
          discountType={projDiscountType}
          discountPercent={Number(project.discount_percent) || 0}
          discountAmount={Number(project.discount_amount) || 0}
          additionalDiscount={Number(project.additional_discount) || 0}
          taxPercent={Number(project.tax_percent) || 0}
          myCost={admin ? totalMyCost : undefined}
          myShipping={admin ? totalMyShipping : undefined}
        />
      )}
    </div>
    </InvoiceDiscountProvider>
  );
}
