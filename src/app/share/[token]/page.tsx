import { notFound } from "next/navigation";
import {
  getProjectByShareToken,
  getClientSafeItemsByProjectId,
} from "@/lib/actions/projects";
import { firstImage } from "@/lib/parse-images";
import { ShareActions, StatusBadge } from "./share-actions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const { project, client } = await getProjectByShareToken(token);

  if (!project) return { title: "Invoice Not Found" };

  return {
    title: `${project.name} — ${client?.name ?? "Invoice"}`,
    description: `Invoice for ${project.name}`,
  };
}

export default async function SharedInvoicePage({ params }: Props) {
  const { token } = await params;
  const { project, client } = await getProjectByShareToken(token);

  if (!project) notFound();

  const items = await getClientSafeItemsByProjectId(project.id);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {project.name}
              </h1>
              {client && (
                <p className="mt-1 text-sm text-gray-500">
                  Prepared for {client.name}
                </p>
              )}
              {project.invoice_number && (
                <p className="mt-1 text-xs font-medium text-gray-400">
                  Invoice #{project.invoice_number}
                </p>
              )}
            </div>
            <div className="text-right">
              <StatusBadge status={project.status} />
              {project.date_required && (
                <p className="mt-1 text-xs text-gray-500">
                  Required by{" "}
                  {new Date(project.date_required).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Items */}
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
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
          />
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            This is a live invoice — prices may be updated at any time.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Powered by SimsForHire
          </p>
        </div>
      </main>
    </div>
  );
}
