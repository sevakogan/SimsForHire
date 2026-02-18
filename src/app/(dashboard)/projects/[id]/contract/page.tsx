import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/actions/projects";
import { getClientSafeItemsByProjectId } from "@/lib/actions/projects";
import { getCompanyInfo } from "@/lib/actions/company-info";
import { calculateInvoiceTotals } from "@/lib/invoice-calculations";
import { ContractWithPdf } from "@/components/portal/contract-with-pdf";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { DiscountType, FulfillmentType } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContractPage({ params }: Props) {
  const { id } = await params;
  const [project, company] = await Promise.all([
    getProjectById(id),
    getCompanyInfo(),
  ]);
  if (!project) notFound();

  // Fetch client info for the contract header
  const supabase = await createSupabaseServer();
  const { data: client } = await supabase
    .from("clients")
    .select("name, email, phone, address")
    .eq("id", project.client_id)
    .single();

  const isSigned = project.contract_signed_at !== null;
  const isViewed = project.contract_viewed_at !== null;
  const companyName = company.name || "SimsForHire (LevelSim LLC Holdings)";

  // Calculate totals
  const items = await getClientSafeItemsByProjectId(project.id);
  const itemsTotal = items.reduce((sum, item) => {
    const cat = (item as { category?: string }).category ?? "product";
    const price = Number(item.price_sold_for ?? item.retail_price);
    const qty = item.quantity ?? 1;
    return cat === "service" ? sum : sum + price * qty;
  }, 0);
  const serviceTotal = items.reduce((sum, item) => {
    const cat = (item as { category?: string }).category ?? "product";
    const price = Number(item.price_sold_for ?? item.retail_price);
    const qty = item.quantity ?? 1;
    return cat === "service" ? sum + price * qty : sum;
  }, 0);
  const shippingTotal = items.reduce(
    (sum, item) => sum + Number(item.retail_shipping) * (item.quantity ?? 1),
    0
  );
  const deliveryTotal = serviceTotal + shippingTotal;
  const discountType = (project.discount_type ?? "percent") as DiscountType;
  const totals = calculateInvoiceTotals({
    itemsTotal,
    deliveryTotal,
    discountType,
    discountPercent: Number(project.discount_percent) || 0,
    discountValue: Number(project.discount_amount) || 0,
    taxPercent: Number(project.tax_percent) || 0,
  });

  const buyerInfo = {
    name: client?.name ?? "—",
    email: client?.email ?? null,
    phone: client?.phone ?? null,
    address: client?.address ?? null,
  };

  const orderInfo = {
    orderRef: project.invoice_number,
    date: new Date(project.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    total: totals.grandTotal,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-foreground">
          Purchase Agreement
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSigned
            ? `Signed by ${project.contract_signed_by} on ${new Date(project.contract_signed_at!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
            : isViewed
              ? "Customer has viewed the contract but hasn't signed yet"
              : "Waiting for customer to view and sign"}
        </p>
      </div>

      {/* Status indicator for unsigned */}
      {!isSigned && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${
            isViewed
              ? "border-amber-200 bg-amber-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isViewed ? "bg-amber-100" : "bg-gray-100"
            }`}
          >
            {isViewed ? (
              <svg
                className="h-5 w-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            )}
          </div>
          <div>
            <h3
              className={`text-sm font-semibold ${
                isViewed ? "text-amber-800" : "text-gray-600"
              }`}
            >
              {isViewed ? "Contract Viewed" : "Awaiting Customer"}
            </h3>
            <p
              className={`text-xs ${
                isViewed ? "text-amber-600" : "text-gray-500"
              }`}
            >
              {isViewed
                ? `Viewed on ${new Date(project.contract_viewed_at!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`
                : "The customer has not yet opened the contract page"}
            </p>
          </div>
        </div>
      )}

      {/* Signed: show full contract with signatures + PDF download */}
      {isSigned && (
        <ContractWithPdf
          buyer={buyerInfo}
          order={orderInfo}
          companyName={companyName}
          signedBy={project.contract_signed_by ?? "—"}
          signedAt={project.contract_signed_at!}
          signatureDataUrl={project.contract_signature_data ?? null}
          initialsDataUrl={project.contract_initials_data ?? null}
          logoUrl={company.logo_url ?? null}
          logoScale={company.logo_scale ?? 100}
          fulfillmentType={project.fulfillment_type as FulfillmentType}
          shippingAddress={project.shipping_address}
          items={items}
          itemsTotal={itemsTotal}
          deliveryTotal={deliveryTotal}
          discountAmount={totals.discountAmount}
          taxAmount={totals.taxAmount}
          grandTotal={totals.grandTotal}
        />
      )}

      {/* Unsigned: show a preview of the contract content */}
      {!isSigned && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-7 w-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Purchase Agreement
            </h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              The customer will see the full SimsForHire Purchase Agreement
              when they visit their portal. Once signed, the completed contract
              with signature and initials will appear here.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-gray-200" />
              <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              <div className="h-px w-8 bg-gray-200" />
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Share the portal link with your customer to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
