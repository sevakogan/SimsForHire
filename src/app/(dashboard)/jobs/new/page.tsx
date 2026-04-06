"use client";

import { useRouter } from "next/navigation";
import { JobForm } from "@/components/jobs/JobForm";
import type { JobImage } from "@/lib/jobs/types";

export default function NewJobPage() {
  const router = useRouter();

  async function handleSave(data: {
    title: string;
    description: string;
    requirements: string;
    tags: string[];
    images: JobImage[];
    status: "active" | "paused";
  }) {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        requirements_input: data.requirements,
        tags: data.tags,
        images: data.images,
        status: data.status,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to create job" }));
      throw new Error(err.error || "Failed to create job");
    }

    router.push("/jobs");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New Job</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new job listing for the careers page
        </p>
      </div>
      <JobForm onSave={handleSave} />
    </div>
  );
}
