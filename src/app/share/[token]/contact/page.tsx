import { notFound } from "next/navigation";
import { getProjectByShareToken } from "@/lib/actions/projects";
import { ContactForm } from "@/components/portal/contact-form";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ContactPage({ params }: Props) {
  const { token } = await params;
  const { project, client } = await getProjectByShareToken(token);

  if (!project) notFound();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
          Contact Us
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          Have a question or need help? Send us a message.
        </p>
      </div>

      <div className="mx-auto max-w-lg">
        <ContactForm
          shareToken={token}
          defaultName={client?.name ?? ""}
          defaultEmail={client?.email ?? ""}
        />
      </div>
    </>
  );
}
