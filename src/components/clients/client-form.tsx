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
      const company_name = (form.get("company_name") as string).trim() || null;
      const company_phone = (form.get("company_phone") as string).trim() || null;
      const company_email = (form.get("company_email") as string).trim() || null;
      const website = (form.get("website") as string).trim() || null;
      const instagram = (form.get("instagram") as string).trim() || null;

      if (!name) {
        setError("Name is required");
        setLoading(false);
        return;
      }

      const fields = { name, phone, email, address, company_name, company_phone, company_email, website, instagram };

      const result = client
        ? await updateClient(client.id, fields)
        : await createClient({
            name,
            phone: phone ?? undefined,
            email: email ?? undefined,
            address: address ?? undefined,
            company_name: company_name ?? undefined,
            company_phone: company_phone ?? undefined,
            company_email: company_email ?? undefined,
            website: website ?? undefined,
            instagram: instagram ?? undefined,
          });

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

      {/* Personal info */}
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

      {/* Company info section */}
      <div className="border-t border-gray-100 pt-5">
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
          Company Info
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className={formStyles.group}>
            <label htmlFor="company_name" className={formStyles.label}>
              Company Name
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              defaultValue={client?.company_name ?? ""}
              placeholder="Company LLC"
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.group}>
            <label htmlFor="company_phone" className={formStyles.label}>
              Company Phone
            </label>
            <input
              id="company_phone"
              name="company_phone"
              type="tel"
              defaultValue={client?.company_phone ?? ""}
              placeholder="(555) 000-0000"
              className={formStyles.input}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 mt-5">
          <div className={formStyles.group}>
            <label htmlFor="company_email" className={formStyles.label}>
              Company Email
            </label>
            <input
              id="company_email"
              name="company_email"
              type="email"
              defaultValue={client?.company_email ?? ""}
              placeholder="info@company.com"
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.group}>
            <label htmlFor="website" className={formStyles.label}>
              Website
            </label>
            <input
              id="website"
              name="website"
              type="url"
              defaultValue={client?.website ?? ""}
              placeholder="https://company.com"
              className={formStyles.input}
            />
          </div>
        </div>

        <div className="mt-5">
          <div className={formStyles.group}>
            <label htmlFor="instagram" className={formStyles.label}>
              Instagram
            </label>
            <input
              id="instagram"
              name="instagram"
              type="text"
              defaultValue={client?.instagram ?? ""}
              placeholder="@username or https://instagram.com/username"
              className={formStyles.input}
            />
          </div>
        </div>
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
