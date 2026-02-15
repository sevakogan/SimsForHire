"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { Client } from "@/types";

export async function getClients(): Promise<Client[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Client;
}

export async function createClient(input: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { id: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { id: data.id, error: null };
}

export async function updateClient(
  id: string,
  input: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const payload = {
    ...(input.name !== undefined && { name: input.name }),
    phone: input.phone || null,
    email: input.email || null,
    address: input.address || null,
  };

  const { error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteClient(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { error: null };
}
