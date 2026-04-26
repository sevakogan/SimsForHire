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
      {/* Miami gradient base */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(255,91,167,0.22), transparent 55%), radial-gradient(ellipse at bottom right, rgba(123,208,245,0.22), transparent 55%), linear-gradient(180deg, #150818 0%, #0a0a18 50%, #08151c 100%)",
        }}
      />
      {/* Subtle Miami grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#FF5BA7 1px, transparent 1px), linear-gradient(90deg, #7BD0F5 1px, transparent 1px)",
          backgroundSize: "40px 40px",
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
