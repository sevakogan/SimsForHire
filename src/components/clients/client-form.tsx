"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, updateClient } from "@/lib/actions/clients";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";
import type { Client } from "@/types";

interface ClientFormProps {
  client?: Client;
  onSuccess?: () => void;
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const form = new FormData(e.currentTarget);
      const name = (form.get("name") as string).trim();
      const phone = (form.get("phone") as string).trim() || null;
      const email = (form.get("email") as string).trim() || null;
      const address = (form.get("address") as string).trim() || null;

      if (!name) {
        setError("Name is required");
        setLoading(false);
        return;
      }

      const result = client
        ? await updateClient(client.id, { name, phone, email, address })
        : await createClient({ name, phone: phone ?? undefined, email: email ?? undefined, address: address ?? undefined });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (!client && "id" in result && result.id) {
        router.push(`/clients/${result.id}`);
      } else {
        router.refresh();
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
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
