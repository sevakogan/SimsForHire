import { notFound } from "next/navigation";
import { getProjectByShareToken } from "@/lib/actions/projects";
import { getShipmentsByShareToken } from "@/lib/actions/shipments";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  label_created: "Label Created",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export default async function ShipmentsPage({ params }: Props) {
  const { token } = await params;
  const { project } = await getProjectByShareToken(token);

  if (!project) notFound();

  const shipments = await getShipmentsByShareToken(token);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
          Shipments
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          Track the delivery of your items
        </p>
      </div>

      {shipments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <svg
            className="mx-auto h-10 w-10 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
            />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">
            No shipments yet
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Tracking information will appear here once items are shipped.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((shipment) => (
            <div
              key={shipment.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {shipment.carrier_name}
                    </h3>
                    <Badge variant={shipment.status}>
                      {STATUS_LABELS[shipment.status] ?? shipment.status}
                    </Badge>
                  </div>

                  {shipment.tracking_number && (
                    <p className="mt-1 text-xs text-gray-500">
                      Tracking: {shipment.tracking_number}
                    </p>
                  )}

                  {shipment.notes && (
                    <p className="mt-2 text-xs text-gray-600">
                      {shipment.notes}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(shipment.created_at).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>

                {shipment.tracking_url && (
                  <a
                    href={shipment.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
                  >
                    Track
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
