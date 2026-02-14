import { ClientForm } from "@/components/clients/client-form";
import { cardStyles } from "@/components/ui/form-styles";

export default function NewClientPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">New Client</h1>
      <div className={cardStyles.base}>
        <ClientForm />
      </div>
    </div>
  );
}
