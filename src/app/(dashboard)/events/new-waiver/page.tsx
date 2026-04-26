import { NewWaiverEventForm } from "@/components/events/new-waiver-event-form";

export default function NewWaiverEventPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          New Waiver Event
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a public waiver-sign page with QR code. Collect signatures with full audit trail.
        </p>
      </div>
      <NewWaiverEventForm />
    </div>
  );
}
