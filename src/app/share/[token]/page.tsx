import { notFound } from "next/navigation";
import {
  getProjectByShareToken,
  getClientSafeItemsByProjectId,
} from "@/lib/actions/projects";
import { firstImage } from "@/lib/parse-images";
import { ShareActions, StatusBadge } from "./share-actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharedInvoicePage({ params }: Props) {
  const { token } = await params;
  const { project } = await getProjectByShareToken(token);

  if (!project) notFound();

  const items = await getClientSafeItemsByProjectId(project.id);

  console.log(
    "[ShareInvoicePage] project:",
    project.id,
    "item count:",
    items.length,
    "item images:",
    items.map((item) => ({
      id: item.id,
      image_url: item.image_url,
      desc: item.description?.slice(0, 30),
    }))
  );

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

  console.log(
    "[ShareInvoicePage] itemDisplayData thumbs:",
    itemDisplayData.map((d) => ({ id: d.id, thumb: d.thumb, name: d.name }))
  );

  return (
    <>
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Invoice
          </h1>
          {project.date_required && (
            <p className="mt-1 text-xs text-gray-500">
              Required by{" "}
              {new Date(project.date_required).toLocaleDateString()}
            </p>
          )}
        </div>
        <StatusBadge status={project.status} />
      </div>

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
        />
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          This is a live invoice — prices may be updated at any time.
        </p>
      </div>
    </>
  );
}
