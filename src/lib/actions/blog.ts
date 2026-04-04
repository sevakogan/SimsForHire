"use server";

import { getAdminSupabase } from "@/lib/supabase-admin";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_html: string;
  category: string | null;
  published_at: string;
  updated_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createBlogPost(post: {
  slug: string;
  title: string;
  excerpt?: string;
  body_html: string;
  category?: string;
  meta_title?: string;
  meta_description?: string;
  is_published?: boolean;
}): Promise<BlogPost> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      ...post,
      published_at: new Date().toISOString(),
      is_published: post.is_published ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBlogPost(
  id: string,
  updates: Partial<Omit<BlogPost, "id" | "published_at">>
): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("blog_posts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteBlogPost(id: string): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Admin-only: fetch ALL posts including drafts
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}
