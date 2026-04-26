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

  return (
    <main className="min-h-screen bg-[#0a0a12] text-white">
      {/* Subtle Miami grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
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
          <h1 className="mt-3 text-xl font-black tracking-tight">{event.name}</h1>
          <p className="mt-1 text-[12px] text-white/60">
            Read &amp; sign to participate
          </p>
        </header>

        <WaiverSignForm
          eventSlug={event.slug}
          eventName={event.name}
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
