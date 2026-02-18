import { notFound } from "next/navigation";
import { getProjectByShareToken, markContractViewed } from "@/lib/actions/projects";
import { PortalAuthGate } from "@/components/portal/portal-auth-gate";
import { ContractSignForm } from "@/components/portal/contract-sign-form";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ContractPage({ params }: Props) {
  const { token } = await params;
  const { project } = await getProjectByShareToken(token);

  if (!project) notFound();

  // Record that the customer viewed the contract (idempotent)
  await markContractViewed(token);

  const isSigned = project.contract_signed_at !== null;

  return (
    <PortalAuthGate token={token}>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
          Contract
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          Review and sign the contract for your project
        </p>
      </div>

      {/* Contract content placeholder */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm mb-6">
        <div className="prose prose-sm max-w-none text-gray-700">
          <h2 className="text-base font-semibold text-gray-900">
            Terms &amp; Conditions
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Contract details for this project will be provided by your
            representative. By signing below, you acknowledge that you have
            reviewed the terms associated with this project and agree to
            proceed.
          </p>

          {/* Decorative divider */}
          <div className="my-6 flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-gray-200" />
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            <div className="h-px w-12 bg-gray-200" />
          </div>

          <p className="text-xs text-gray-400">
            If you have questions about the contract, please contact your
            representative before signing.
          </p>
        </div>
      </div>

      {/* Signed state */}
      {isSigned ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-green-800">
            Contract Signed
          </h3>
          <p className="mt-1 text-sm text-green-600">
            Signed by{" "}
            <span className="font-medium">{project.contract_signed_by}</span>
            {" on "}
            {new Date(project.contract_signed_at!).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      ) : (
        <ContractSignForm shareToken={token} />
      )}
    </PortalAuthGate>
  );
}
