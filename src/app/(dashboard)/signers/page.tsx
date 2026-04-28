import { listAllSigners } from "@/lib/actions/waiver-events";
import { SignersView } from "@/components/signers/signers-view";

export const dynamic = "force-dynamic";

export default async function SignersPage() {
  const signers = await listAllSigners();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Leads
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every waiver signature collected across all events. {signers.length} total.
        </p>
      </div>
      <SignersView signers={signers} />
    </div>
  );
}
