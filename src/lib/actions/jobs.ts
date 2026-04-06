"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/lib/supabase-admin";
import type { Job, JobApplication, ApplicationStatus } from "@/lib/jobs/types";

export async function getJobs(): Promise<Job[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch jobs:", error.message);
    return [];
  }

  return (data ?? []) as Job[];
}

export async function getApplications(): Promise<JobApplication[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("job_applications")
    .select("*, jobs(title)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch applications:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const { jobs, ...rest } = row as Record<string, unknown> & { jobs?: { title: string } | null };
    return {
      ...rest,
      job_title: jobs?.title ?? "Unknown",
    };
  }) as unknown as JobApplication[];
}

export async function updateJobStatus(
  jobId: string,
  status: Job["status"]
): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (error) {
    throw new Error(`Failed to update job status: ${error.message}`);
  }

  revalidatePath("/jobs");
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) {
    throw new Error(`Failed to update application status: ${error.message}`);
  }

  revalidatePath("/jobs");
}

export async function deleteJob(jobId: string): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);

  if (error) {
    throw new Error(`Failed to delete job: ${error.message}`);
  }

  revalidatePath("/jobs");
}
