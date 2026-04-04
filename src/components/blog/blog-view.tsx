"use client";

import { useState, useTransition } from "react";
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  type BlogPost,
} from "@/lib/actions/blog";

interface Props {
  initialPosts: BlogPost[];
}

type Mode = "list" | "create" | "edit";

function BlogPreviewModal({
  post,
  onClose,
}: {
  post: { title: string; excerpt: string; body_html: string; category: string; published_at: string };
  onClose: () => void;
}) {
  const date = new Date(post.published_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Build a full HTML document matching the Astro blog/[slug] page design.
  // Rendered in a sandboxed iframe — no scripts execute, no access to parent DOM.
  const previewHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0A0A0A;color:#86868B;font-family:Inter,system-ui,sans-serif;font-size:17px;line-height:1.8;-webkit-font-smoothing:antialiased}
  .nav{border-bottom:1px solid rgba(255,255,255,0.08);padding:0 40px;height:64px;display:flex;align-items:center;justify-content:space-between}
  .nav span{font-size:11px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:#AEAEB2}
  .nav em{font-size:11px;font-style:normal;color:#E10600;letter-spacing:.1em;text-transform:uppercase}
  .wrap{padding:48px 40px 80px;max-width:900px;margin:0 auto}
  .back{font-size:11px;text-transform:uppercase;letter-spacing:.2em;color:#555;margin-bottom:40px}
  .cat{font-size:10px;text-transform:uppercase;letter-spacing:.5em;color:#E10600;margin-bottom:16px}
  h1{font-family:'Bebas Neue',Impact,sans-serif;font-size:clamp(2.5rem,6vw,5rem);font-weight:400;letter-spacing:.05em;line-height:.9;color:white;margin-bottom:24px}
  .excerpt{color:#86868B;font-size:17px;line-height:1.7;margin-bottom:24px;max-width:600px}
  .meta{display:flex;align-items:center;gap:12px;font-size:11px;text-transform:uppercase;letter-spacing:.2em;color:rgba(255,255,255,.3);margin-bottom:40px}
  .meta span.dot{color:rgba(255,255,255,.1)}
  .divider{height:1px;background:rgba(255,255,255,.08);margin-bottom:40px}
  .body{color:#86868B;font-size:17px;line-height:1.8;max-width:700px}
  .body h2,.body h3{font-family:'Bebas Neue',Impact,sans-serif;color:white;letter-spacing:.05em;margin:2rem 0 .75rem;font-weight:400;font-size:2rem}
  .body h3{font-size:1.5rem}
  .body p{margin:0 0 1.25rem}
  .body ul,.body ol{padding-left:1.5rem;margin:0 0 1.25rem}
  .body li{margin-bottom:.5rem}
  .body strong{color:white}
  .body a{color:#E10600;text-decoration:none}
  .body blockquote{border-left:3px solid #E10600;padding-left:1rem;margin:0 0 1.25rem;color:rgba(255,255,255,.5)}
  .cta{margin-top:64px;padding-top:40px;border-top:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px}
  .cta-text p{font-size:10px;text-transform:uppercase;letter-spacing:.5em;color:#E10600;margin-bottom:8px}
  .cta-text h2{font-family:'Bebas Neue',Impact,sans-serif;font-size:32px;color:white;letter-spacing:.05em;font-weight:400}
  .cta-btns{display:flex;gap:12px}
  .btn-red{background:#E10600;color:white;padding:10px 24px;font-size:12px;text-transform:uppercase;letter-spacing:.25em;font-family:'Bebas Neue',Impact,sans-serif}
  .btn-out{border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.7);padding:10px 24px;font-size:12px;text-transform:uppercase;letter-spacing:.25em;font-family:'Bebas Neue',Impact,sans-serif}
</style>
</head>
<body>
<div class="nav"><span>simsforhire.com/blog/${post.category ? post.category.toLowerCase() : "preview"}</span><em>Preview</em></div>
<div class="wrap">
  <div class="back">← Back to Blog</div>
  ${post.category ? `<p class="cat">${post.category}</p>` : ""}
  <h1>${post.title}</h1>
  ${post.excerpt ? `<p class="excerpt">${post.excerpt}</p>` : ""}
  <div class="meta"><span>${date}</span><span class="dot">·</span><span>SimsForHire</span></div>
  <div class="divider"></div>
  <div class="body">${post.body_html}</div>
  <div class="cta">
    <div class="cta-text"><p>Ready to Race?</p><h2>Book Your Event</h2></div>
    <div class="cta-btns"><span class="btn-red">Call Now</span><span class="btn-out">More Posts</span></div>
  </div>
</div>
</body>
</html>`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Top bar */}
      <div style={{
        width: "100%",
        height: 48,
        background: "#111",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: "#AEAEB2", fontFamily: "system-ui", letterSpacing: "0.05em" }}>
          Preview — simsforhire.com/blog/{post.category?.toLowerCase() || "post"}
        </span>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "white",
            borderRadius: 6,
            padding: "4px 12px",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "system-ui",
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Sandboxed iframe preview */}
      <iframe
        srcDoc={previewHtml}
        sandbox="allow-same-origin"
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          background: "#0A0A0A",
        }}
        title="Blog post preview"
      />
    </div>
  );
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BlogView({ initialPosts }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [previewing, setPreviewing] = useState<{
    title: string; excerpt: string; body_html: string; category: string; published_at: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [category, setCategory] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  // AI generation state
  const [aiTopic, setAiTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  function openCreate() {
    setEditing(null);
    setTitle(""); setSlug(""); setExcerpt(""); setBodyHtml("");
    setCategory(""); setMetaTitle(""); setMetaDesc(""); setIsPublished(false);
    setAiTopic(""); setAiError("");
    setMode("create");
  }

  function openEdit(post: BlogPost) {
    setEditing(post);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt ?? "");
    setBodyHtml(post.body_html);
    setCategory(post.category ?? "");
    setMetaTitle(post.meta_title ?? "");
    setMetaDesc(post.meta_description ?? "");
    setIsPublished(post.is_published);
    setAiTopic(""); setAiError("");
    setMode("edit");
  }

  async function handleGenerate() {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    setAiError("");
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, title: title || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      const data = await res.json();
      if (data.title && !title) setTitle(data.title);
      if (data.slug && !slug) setSlug(data.slug);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.body_html) setBodyHtml(data.body_html);
      if (data.meta_title) setMetaTitle(data.meta_title);
      if (data.meta_description) setMetaDesc(data.meta_description);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    startTransition(async () => {
      try {
        if (mode === "create") {
          const post = await createBlogPost({
            slug: slug || slugify(title),
            title,
            excerpt: excerpt || undefined,
            body_html: bodyHtml,
            category: category || undefined,
            meta_title: metaTitle || undefined,
            meta_description: metaDesc || undefined,
            is_published: isPublished,
          });
          setPosts((prev) => [post, ...prev]);
        } else if (editing) {
          await updateBlogPost(editing.id, {
            slug: slug || slugify(title),
            title,
            excerpt: excerpt || null,
            body_html: bodyHtml,
            category: category || null,
            meta_title: metaTitle || null,
            meta_description: metaDesc || null,
            is_published: isPublished,
          });
          setPosts((prev) =>
            prev.map((p) =>
              p.id === editing.id
                ? { ...p, slug, title, excerpt, body_html: bodyHtml, category, meta_title: metaTitle, meta_description: metaDesc, is_published: isPublished }
                : p
            )
          );
        }
        setMode("list");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  async function handleDelete(post: BlogPost) {
    if (!confirm(`Delete "${post.title}"?`)) return;
    startTransition(async () => {
      await deleteBlogPost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    });
  }

  async function handleTogglePublish(post: BlogPost) {
    startTransition(async () => {
      await updateBlogPost(post.id, { is_published: !post.is_published });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, is_published: !p.is_published } : p
        )
      );
    });
  }

  if (mode === "list") {
    return (
      <div>
        {previewing && (
          <BlogPreviewModal post={previewing} onClose={() => setPreviewing(null)} />
        )}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={openCreate}
            className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            + New Post
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-border bg-white p-12 text-center">
            <p className="text-2xl font-display text-foreground mb-2">No posts yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first blog post</p>
            <button
              onClick={openCreate}
              className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium"
            >
              Create Post
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            {posts.map((post, i) => (
              <div
                key={post.id}
                className={`flex items-center gap-4 px-5 py-4 ${i < posts.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${
                        post.is_published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {post.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {post.category && <span className="text-[#E10600] mr-2">{post.category}</span>}
                    {formatDate(post.published_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setPreviewing({
                      title: post.title,
                      excerpt: post.excerpt ?? "",
                      body_html: post.body_html,
                      category: post.category ?? "",
                      published_at: post.published_at,
                    })}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleTogglePublish(post)}
                    disabled={isPending}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                  >
                    {post.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post)}
                    disabled={isPending}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Create / Edit form
  return (
    <div className="max-w-3xl">
      {previewing && (
        <BlogPreviewModal post={previewing} onClose={() => setPreviewing(null)} />
      )}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode("list")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            {mode === "create" ? "New Post" : `Edit: ${editing?.title}`}
          </h2>
        </div>
        {(title || bodyHtml) && (
          <button
            onClick={() => setPreviewing({
              title: title || "Untitled",
              excerpt,
              body_html: bodyHtml,
              category,
              published_at: editing?.published_at ?? new Date().toISOString(),
            })}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            View Preview
          </button>
        )}
      </div>

      {/* AI Generator */}
      <div className="rounded-xl border border-border bg-white p-5 mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          AI Generate
        </p>
        <div className="flex gap-3">
          <input
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Topic or title (e.g. 'Best tracks for beginners in sim racing')"
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !aiTopic.trim()}
            className="rounded-lg bg-[#E10600] text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity whitespace-nowrap"
          >
            {generating ? "Generating…" : "Generate"}
          </button>
        </div>
        {aiError && <p className="mt-2 text-xs text-red-600">{aiError}</p>}
        {generating && (
          <p className="mt-2 text-xs text-muted-foreground">Writing your post with AI…</p>
        )}
      </div>

      {/* Form fields */}
      <div className="rounded-xl border border-border bg-white p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Title *</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!editing) setSlug(slugify(e.target.value));
              }}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Post title"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="url-slug"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="e.g. Tips, Events, News"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
            placeholder="Short summary shown on listing page"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Body HTML *
          </label>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-y"
            placeholder="<p>Post content as HTML...</p>"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Meta Title</label>
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="SEO title (optional)"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Meta Description</label>
            <input
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="SEO description (optional)"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
          </label>
          <span className="text-sm text-foreground">
            {isPublished ? "Published (live on website)" : "Draft (not visible)"}
          </span>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={isPending || !title.trim() || !bodyHtml.trim()}
          className="rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
        >
          {isPending ? "Saving…" : mode === "create" ? "Create Post" : "Save Changes"}
        </button>
        <button
          onClick={() => setMode("list")}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
