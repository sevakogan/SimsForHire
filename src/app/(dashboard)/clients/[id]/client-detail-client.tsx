"use client";

import { useState } from "react";
import { ClientForm } from "@/components/clients/client-form";
import { buttonStyles } from "@/components/ui/form-styles";
import type { Client } from "@/types";

interface Props {
  client: Client;
}

export function ClientDetailClient({ client }: Props) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={`${buttonStyles.secondary} mt-4`}
      >
        Edit Client
      </button>
    );
  }

  return (
    <div className="mt-6 border-t border-border pt-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Edit Client
      </h3>
      <ClientForm client={client} onSuccess={() => setEditing(false)} />
    </div>
  );
}
