"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { JobForm } from "@/components/jobs/JobForm";
import type { Job, JobImage } from "@/lib/jobs/types";

export default function EditJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/jobs/${params.id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setJob(data.data ?? data);
      } catch {
        router.push("/jobs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  async function handleSave(data: {
    title: string;
    description: string;
    requirements: string;
    tags: string[];
    images: JobImage[];
    status: "active" | "paused";
  }) {
    const res = await fetch(`/api/jobs/${params.id}`, {
      method: "PUT",
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
      const err = await res.json().catch(() => ({ error: "Failed to update job" }));
      throw new Error(err.error || "Failed to update job");
    }

    router.push("/jobs");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-muted" />
        <div className="h-[400px] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Edit Job</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update &ldquo;{job.title}&rdquo;
        </p>
      </div>
      <JobForm job={job} onSave={handleSave} />
    </div>
  );
}
