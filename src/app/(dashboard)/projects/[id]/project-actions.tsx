"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "@/lib/actions/projects";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";
import type { Project, ProjectStatus } from "@/types";

const statusOptions: ProjectStatus[] = ["draft", "quote", "accepted", "completed"];

interface Props {
  project: Project;
}

export function ProjectActions({ project }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  async function handleStatusChange(status: ProjectStatus) {
    setLoading(true);
    await updateProject(project.id, { status });
    router.refresh();
    setLoading(false);
  }

  async function handleInvoiceSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await updateProject(project.id, {
      invoice_link: (form.get("invoice_link") as string) || undefined,
      invoice_link_2: (form.get("invoice_link_2") as string) || undefined,
    });
    router.refresh();
    setShowInvoice(false);
    setLoading(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={loading || project.status === status}
            className={`${buttonStyles.small} ${
              project.status === status
                ? "bg-primary text-white"
                : "border border-border text-muted-foreground hover:bg-muted"
            } rounded-full`}
          >
            {status}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowInvoice(!showInvoice)}
        className={buttonStyles.secondary}
      >
        Invoice Links
      </button>

      {showInvoice && (
        <form
          onSubmit={handleInvoiceSave}
          className="flex w-full items-end gap-3"
        >
          <div className={`${formStyles.group} flex-1`}>
            <label htmlFor="invoice_link" className={formStyles.label}>
              Invoice Link 1
            </label>
            <input
              id="invoice_link"
              name="invoice_link"
              type="url"
              defaultValue={project.invoice_link ?? ""}
              placeholder="https://..."
              className={formStyles.input}
            />
          </div>
          <div className={`${formStyles.group} flex-1`}>
            <label htmlFor="invoice_link_2" className={formStyles.label}>
              Invoice Link 2
            </label>
            <input
              id="invoice_link_2"
              name="invoice_link_2"
              type="url"
              defaultValue={project.invoice_link_2 ?? ""}
              placeholder="https://..."
              className={formStyles.input}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={buttonStyles.primary}
          >
            Save
          </button>
        </form>
      )}
    </div>
  );
}
