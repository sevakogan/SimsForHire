import { notFound } from "next/navigation";
import {
  getProjectByShareToken,
  getClientSafeItemsByProjectId,
} from "@/lib/actions/projects";
import { firstImage } from "@/lib/parse-images";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/invoice-calculations";
import { getCompanyInfo } from "@/lib/actions/company-info";
import { createSupabaseServer } from "@/lib/supabase-server";
import { ShareActions, StatusBadge } from "./share-actions";
import { PortalAddressEditor } from "@/components/portal/portal-address-editor";
import { PortalStepsGuide } from "@/components/portal/portal-steps-guide";
import type { DiscountType } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

async function isPortalAuthenticated(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

export default async function SharedInvoicePage({ params }: Props) {
  const { token } = await params;
  const [{ project, client }, company] = await Promise.all([
    getProjectByShareToken(token),
    getCompanyInfo(),
  ]);

  if (!project) notFound();

  const [items, isAuthenticated] = await Promise.all([
    getClientSafeItemsByProjectId(project.id),
    isPortalAuthenticated(),
  ]);

  // Pre-compute display data for each item (passed to client component)
  const itemDisplayData = items.map((item) => {
    const qty = item.quantity ?? 1;
    const price = Number(item.price_sold_for ?? item.retail_price);
    const shipping = Number(item.retail_shipping);
    const total = (price + shipping) * qty;
    const thumb = firstImage(item.image_url);

    return {
      id: item.id,
      thumb,
      name: item.description || item.item_type || "Item",
      itemType: item.item_type || null,
      qty,
      price,
      shipping,
      total,
    };
  });

  const totalItems = items.length;

  // Use shared calculation util — discount/tax on items only
  // Split by category: service items go to services total, product items to items total
  const itemsTotal = items.reduce((sum, item, idx) => {
    const cat = (item as { category?: string }).category ?? "product";
    return cat === "service" ? sum : sum + itemDisplayData[idx].price * itemDisplayData[idx].qty;
  }, 0);
  const serviceRetailTotal = items.reduce((sum, item, idx) => {
    const cat = (item as { category?: string }).category ?? "product";
    return cat === "service" ? sum + itemDisplayData[idx].price * itemDisplayData[idx].qty : sum;
  }, 0);
  const shippingTotal = itemDisplayData.reduce((sum, i) => sum + i.shipping * i.qty, 0);
  const deliveryTotal = serviceRetailTotal + shippingTotal;
  const discountType = (project.discount_type ?? "percent") as DiscountType;
  const discPct = Number(project.discount_percent) || 0;
  const discAmt = Number(project.discount_amount) || 0;
  const addlDisc = Number(project.additional_discount) || 0;
  const taxPct = Number(project.tax_percent) || 0;

  const totals = calculateInvoiceTotals({
    itemsTotal,
    deliveryTotal,
    discountType,
    discountPercent: discPct,
    discountValue: discAmt,
    taxPercent: taxPct,
    additionalDiscount: addlDisc,
  });

  const projectNotes = (project.notes ?? "").trim();

  return (
    <>
      {/* ─── Branded Hero Banner ─── */}
      <div className="mb-6 rounded-2xl overflow-hidden shadow-sm">
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-5 py-6 sm:px-8 sm:py-8">
          {/* Decorative background shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative">
            {/* Company branding row */}
            <div className="flex items-center gap-3 sm:gap-4">
              {company.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="shrink-0 rounded-xl bg-white/10 object-contain backdrop-blur-sm ring-1 ring-white/10"
                  style={{
                    width: `${52 * (company.logo_scale / 100)}px`,
                    height: `${52 * (company.logo_scale / 100)}px`,
                  }}
                />
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white sm:text-2xl tracking-tight">
                  {company.name}
                </h2>
                {company.tagline && (
                  <p className="mt-0.5 text-sm text-slate-300/90 sm:text-base">
                    {company.tagline}
                  </p>
                )}
              </div>
            </div>

            {/* Contact row */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                  {company.phone}
                </a>
              )}
              {company.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  {company.email}
                </a>
              )}
              {company.address && (
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span className="truncate">{company.address.split("\n")[0]}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ─── Invoice Details (white card below hero) ─── */}
        <div className="border border-t-0 border-gray-200 bg-white rounded-b-2xl">
          {/* Invoice header + status */}
          <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
                {project.name}
              </h1>
              {client && (
                <p className="mt-0.5 text-sm text-gray-500">
                  Prepared for{" "}
                  <span className="font-medium text-gray-700">{client.name}</span>
                </p>
              )}
            </div>
            <StatusBadge
              status={project.status}
              contractViewedAt={project.contract_viewed_at ?? null}
              contractSignedAt={project.contract_signed_at ?? null}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Detail grid */}
          <div className="px-5 py-4 sm:px-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {project.invoice_number && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Invoice #
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">
                    {project.invoice_number}
                  </p>
                </div>
              )}
              {project.date_required && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Required By
                  </p>
                  <p className="mt-0.5 text-sm text-gray-900">
                    {new Date(project.date_required).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Items
                </p>
                <p className="mt-0.5 text-sm text-gray-900">{totalItems}</p>
              </div>
              {totalItems > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Total
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {formatCurrency(totals.grandTotal)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Invoice notes — only shown if admin wrote something */}
          {projectNotes && (
            <>
              <div className="border-t border-gray-100" />
              <div className="px-5 py-4 sm:px-6">
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1">
                  Notes
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {projectNotes}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Address editor — only for authenticated portal users */}
      {isAuthenticated && (
        <div className="mb-6">
          <PortalAddressEditor
            clientId={project.client_id}
            shareToken={token}
            clientAddress={client?.address ?? null}
            shippingAddress={project.shipping_address ?? null}
            contractSigned={!!project.contract_signed_at}
          />
        </div>
      )}

      {/* Steps guide — between header and invoice items */}
      <PortalStepsGuide
        projectStatus={project.status}
        contractSignedAt={project.contract_signed_at ?? null}
      />

      {/* Items */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-500">No items in this invoice yet.</p>
        </div>
      ) : (
        <ShareActions
          items={items}
          itemDisplayData={itemDisplayData}
          shareToken={token}
          projectStatus={project.status}
          taxPercent={taxPct}
          discountPercent={discPct}
          discountType={discountType}
          discountAmount={discAmt}
          additionalDiscount={addlDisc}
          companyPhone={company.phone ?? null}
          contractViewedAt={project.contract_viewed_at ?? null}
          contractSignedAt={project.contract_signed_at ?? null}
        />
      )}

      {/* Footer is rendered inside ShareActions so it reacts to acceptance state */}
    </>
  );
}
