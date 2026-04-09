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
  featured_image_url: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  focus_keyword: string | null;
  tags: string[] | null;
  author: string | null;
  reading_time_min: number | null;
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
  focus_keyword?: string;
  tags?: string[];
  author?: string;
  featured_image_url?: string;
  og_image_url?: string;
  canonical_url?: string;
  reading_time_min?: number;
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

// ─── Blog Context (memory) ───

export async function getBlogContext(): Promise<string> {
  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "blog_context")
      .single();
    return (data?.value as string) ?? "";
  } catch {
    return "";
  }
}

export async function saveBlogContext(content: string): Promise<void> {
  const supabase = getAdminSupabase();
  const { error: upsertError } = await supabase
    .from("app_config")
    .upsert(
      { key: "blog_context", value: content, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  if (upsertError) throw new Error(upsertError.message);
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
