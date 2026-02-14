"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, updateClient } from "@/lib/actions/clients";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";
import type { Client } from "@/types";

interface ClientFormProps {
  client?: Client;
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const input = {
      name: form.get("name") as string,
      phone: form.get("phone") as string,
      email: form.get("email") as string,
      address: form.get("address") as string,
    };

    if (!input.name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    const result = client
      ? await updateClient(client.id, input)
      : await createClient(input);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (!client && "id" in result && result.id) {
      router.push(`/clients/${result.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className={formStyles.group}>
        <label htmlFor="name" className={formStyles.label}>
          Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={client?.name ?? ""}
          placeholder="Client name"
          className={formStyles.input}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className={formStyles.group}>
          <label htmlFor="email" className={formStyles.label}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            placeholder="client@example.com"
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.group}>
          <label htmlFor="phone" className={formStyles.label}>
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={client?.phone ?? ""}
            placeholder="(555) 123-4567"
            className={formStyles.input}
          />
        </div>
      </div>

      <div className={formStyles.group}>
        <label htmlFor="address" className={formStyles.label}>
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={client?.address ?? ""}
          placeholder="Street, City, State, ZIP"
          className={formStyles.textarea}
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className={buttonStyles.primary}>
          {loading
            ? "Saving..."
            : client
              ? "Update Client"
              : "Create Client"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className={buttonStyles.secondary}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
