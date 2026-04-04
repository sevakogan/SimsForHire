import { NewEventForm } from "@/components/events/new-event-form";

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New Event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new live karting event
        </p>
      </div>
      <NewEventForm />
    </div>
  );
}
