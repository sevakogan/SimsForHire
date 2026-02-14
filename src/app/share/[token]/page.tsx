import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getProjectByShareToken,
  getClientSafeItemsByProjectId,
} from "@/lib/actions/projects";
import { firstImage } from "@/lib/parse-images";
import { ShareActions } from "./share-actions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
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

  const totalSelling = items.reduce(
    (sum, i) => sum + Number(i.price_sold_for ?? i.retail_price),
    0
  );
  const totalShipping = items.reduce(
    (sum, i) => sum + Number(i.retail_shipping),
    0
  );
  const grandTotal = totalSelling + totalShipping;

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
            </div>
            <div className="text-right">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">
                {project.status}
              </span>
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
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-12">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Item
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 w-28">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 w-24">
                      S/H
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 w-28">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => {
                    const price = Number(
                      item.price_sold_for ?? item.retail_price
                    );
                    const shipping = Number(item.retail_shipping);
                    const total = price + shipping;
                    const thumb = firstImage(item.image_url);

                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-gray-50/50"
                      >
                        <td className="px-4 py-3 text-gray-400 tabular-nums">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt=""
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                                  />
                                </svg>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {item.description || item.item_type || "Item"}
                              </p>
                              {item.item_type && (
                                <span className="inline-block mt-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                  {item.item_type}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                          {formatCurrency(price)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                          {formatCurrency(shipping)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout */}
            <div className="space-y-3 sm:hidden">
              {items.map((item, index) => {
                const price = Number(item.price_sold_for ?? item.retail_price);
                const shipping = Number(item.retail_shipping);
                const total = price + shipping;
                const thumb = firstImage(item.image_url);

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-xs font-medium text-gray-400">
                        {index + 1}.
                      </span>
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt=""
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 line-clamp-2">
                          {item.description || item.item_type || "Item"}
                        </p>
                        {item.item_type && (
                          <span className="inline-block mt-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                            {item.item_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-3">
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
                          Price
                        </p>
                        <p className="text-xs font-medium text-gray-900">
                          {formatCurrency(price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
                          S/H
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(shipping)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
                          Total
                        </p>
                        <p className="text-xs font-bold text-gray-900">
                          {formatCurrency(total)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm tabular-nums text-gray-900">
                  {formatCurrency(totalSelling)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">
                  Shipping &amp; Handling
                </span>
                <span className="text-sm tabular-nums text-gray-900">
                  {formatCurrency(totalShipping)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="text-base font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-lg font-bold tabular-nums text-gray-900">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Accept/Reject Actions */}
            <ShareActions
              items={items}
              shareToken={token}
              projectStatus={project.status}
            />
          </>
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
