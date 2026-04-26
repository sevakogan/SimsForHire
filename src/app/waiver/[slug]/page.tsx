import { notFound } from "next/navigation";
import { getEvent } from "@/lib/actions/events";
import { getActiveWaiver } from "@/lib/actions/waiver-events";
import { WaiverSignForm } from "./sign-form";

export const dynamic = "force-dynamic";

export default async function PublicWaiverPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event || event.event_type !== "waiver" || event.status !== "active") {
    notFound();
  }

  const activeWaiver = await getActiveWaiver(event.id);
  if (!activeWaiver) notFound();

  return (
    <main className="min-h-screen bg-[#0a0a12] text-white py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
          <p className="mt-2 text-sm text-white/60">
            Read the waiver carefully and sign below to participate.
          </p>
        </header>

        <WaiverSignForm
          eventSlug={event.slug}
          waiverBody={activeWaiver.body}
          waiverVersion={activeWaiver.version}
        />

        <footer className="mt-10 text-center text-[11px] text-white/40">
          © {new Date().getFullYear()} Sims For Hire
        </footer>
      </div>
    </main>
  );
}
