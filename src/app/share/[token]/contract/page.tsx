import { notFound } from "next/navigation";
import {
  getProjectByShareToken,
  getClientSafeItemsByProjectId,
  markContractViewed,
} from "@/lib/actions/projects";
import { getCompanyInfo } from "@/lib/actions/company-info";
import { calculateInvoiceTotals } from "@/lib/invoice-calculations";
import { PortalAuthGate } from "@/components/portal/portal-auth-gate";
import { PurchaseAgreement } from "@/components/portal/purchase-agreement";
import { SignedAgreementView } from "@/components/portal/signed-agreement-view";
import type { DiscountType, FulfillmentType } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ContractPage({ params }: Props) {
  const { token } = await params;
  const [{ project, client }, company] = await Promise.all([
    getProjectByShareToken(token),
    getCompanyInfo(),
  ]);

  if (!project) notFound();

  // Record that the customer viewed the contract (idempotent)
  await markContractViewed(token);

  // Calculate grand total for the contract header
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

  const isSigned = project.contract_signed_at !== null;
  const companyName = company.name || "SimsForHire (LevelSim LLC Holdings)";
  const logoUrl = company.logo_url ?? null;
  const logoScale = company.logo_scale ?? 100;
  const fulfillmentType = project.fulfillment_type as FulfillmentType;

  return (
    <PortalAuthGate token={token}>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
          Purchase Agreement
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          {isSigned
            ? "Your signed purchase agreement is below"
            : "Review and sign the purchase agreement for your order"}
        </p>
      </div>

      {isSigned ? (
        <SignedAgreementView
          buyer={buyerInfo}
          order={orderInfo}
          companyName={companyName}
          signedBy={project.contract_signed_by ?? "—"}
          signedAt={project.contract_signed_at!}
          signatureDataUrl={project.contract_signature_data ?? null}
          initialsDataUrl={project.contract_initials_data ?? null}
          shareToken={token}
          contractSignedAt={project.contract_signed_at}
          logoUrl={logoUrl}
          logoScale={logoScale}
          fulfillmentType={fulfillmentType}
          shippingAddress={project.shipping_address}
        />
      ) : (
        <PurchaseAgreement
          shareToken={token}
          buyer={buyerInfo}
          order={orderInfo}
          companyName={companyName}
          logoUrl={logoUrl}
          logoScale={logoScale}
          fulfillmentType={fulfillmentType}
          shippingAddress={project.shipping_address}
        />
      )}
    </PortalAuthGate>
  );
}
