import { headers } from "next/headers";
import {
  buildTokenUrl,
  listQrRedirects,
  type QrRedirectWithEvent,
} from "@/lib/actions/qr-redirects";
import { QrCodesView } from "@/components/qr/qr-codes-view";

export const dynamic = "force-dynamic";

export default async function QrCodesPage() {
  const redirects = await listQrRedirects();

  // Pre-build the token URLs server-side so the client doesn't need request
  // headers. We resolve once for the host of the current request.
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const withUrls: Array<QrRedirectWithEvent & { tokenUrl: string }> =
    redirects.map((r) => ({ ...r, tokenUrl: `${origin}/qr/${r.token}` }));

  // Verify the universal QR exists (lazy-create); listQrRedirects ordering
  // already pins is_universal first, but we double-check by token URL build.
  if (!withUrls.some((r) => r.is_universal)) {
    const { getUniversalQr } = await import("@/lib/actions/qr-redirects");
    const universal = await getUniversalQr();
    withUrls.unshift({
      ...universal,
      tokenUrl: await buildTokenUrl(universal.token),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Event QR Codes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Print once, repoint forever. Each QR encodes a stable token URL; the
          destination is editable here. {withUrls.length} total.
        </p>
      </div>
      <QrCodesView initial={withUrls} />
    </div>
  );
}
