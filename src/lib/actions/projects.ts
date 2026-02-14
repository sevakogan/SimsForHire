"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import type { Project, ProjectStatus } from "@/types";

export async function getProjects(filters?: {
  clientId?: string;
}): Promise<Project[]> {
  const supabase = await createSupabaseServer();
  let query = supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Project[];
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Project;
}

export async function createProject(input: {
  client_id: string;
  name: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { id: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: input.client_id,
      name: input.name,
      status: "draft" as ProjectStatus,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id, error: null };
}

export async function updateProject(
  id: string,
  input: {
    name?: string;
    status?: ProjectStatus;
    invoice_link?: string;
    invoice_link_2?: string;
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const { error } = await supabase
    .from("projects")
    .update(input)
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteProject(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}
