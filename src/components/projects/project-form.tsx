"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/actions/projects";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";

interface ProjectFormProps {
  clientId: string;
  onSuccess?: () => void;
}

export function ProjectForm({ clientId, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;

    if (!name.trim()) {
      setError("Project name is required");
      setLoading(false);
      return;
    }

    const result = await createProject({ client_id: clientId, name });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (onSuccess) {
      onSuccess();
    }

    if (result.id) {
      router.push(`/projects/${result.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className={formStyles.group}>
        <label htmlFor="project-name" className={formStyles.label}>
          Project Name *
        </label>
        <input
          id="project-name"
          name="name"
          type="text"
          required
          placeholder="e.g. Kitchen Renovation"
          className={formStyles.input}
        />
      </div>

      <button type="submit" disabled={loading} className={buttonStyles.primary}>
        {loading ? "Creating..." : "Create Project"}
      </button>
    </form>
  );
}
