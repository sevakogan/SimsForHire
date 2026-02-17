import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/actions/projects";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContractPage({ params }: Props) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">
        Contract
      </h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto max-w-md text-center">
          {/* Icon */}
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
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900">Contract</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Contract details for this project will be available here soon.
          </p>

          {/* Decorative divider */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-gray-200" />
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            <div className="h-px w-8 bg-gray-200" />
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Check back later or contact us for more information.
          </p>
        </div>
      </div>
    </div>
  );
}
