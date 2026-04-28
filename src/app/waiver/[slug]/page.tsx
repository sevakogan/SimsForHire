import { notFound } from "next/navigation";
import Image from "next/image";
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

  // Display name lives in event_config (editable). Slug = URL = immutable.
  const displayName = event.config?.event_name?.trim() || event.name;

  return (
    <main className="min-h-screen overflow-x-hidden text-white relative">
      {/* Vibrant Miami F1 fan-fest gradient — pink → purple → baby blue */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "linear-gradient(110deg, #FF1F8E 0%, #D14CC8 30%, #9C70E0 55%, #6FA8F0 78%, #4FCBFF 100%)",
        }}
      />
      {/* Soft white film so dark text/cards stay legible */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ background: "rgba(8, 6, 18, 0.35)" }}
      />
      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative mx-auto max-w-md px-4 py-6">
        {/* Small logo header */}
        <header className="mb-5 flex flex-col items-center text-center">
          <Image
            src="/sims-logo-white-long.png"
            alt="Sims For Hire"
            width={400}
            height={80}
            priority
            className="h-10 w-auto object-contain"
          />
          <h1 className="mt-3 text-xl font-black tracking-tight break-words">
            {displayName}
          </h1>
          <p className="mt-1 text-[12px] text-white/60">
            Read &amp; sign to participate
          </p>
        </header>

        <WaiverSignForm
          eventSlug={event.slug}
          eventName={displayName}
          waiverBody={activeWaiver.body}
          waiverVersion={activeWaiver.version}
        />

        <footer className="mt-8 text-center text-[10px] text-white/40">
          © {new Date().getFullYear()} Sims For Hire · Miami
        </footer>
      </div>
    </main>
  );
}
