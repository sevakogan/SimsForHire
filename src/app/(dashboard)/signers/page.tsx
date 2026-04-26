import { listAllSigners } from "@/lib/actions/waiver-events";
import { SignersView } from "@/components/signers/signers-view";

export const dynamic = "force-dynamic";

export default async function SignersPage() {
  const signers = await listAllSigners();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Waiver Signers
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every signature collected across all waiver events. {signers.length} total.
        </p>
      </div>
      <SignersView signers={signers} />
    </div>
  );
}
