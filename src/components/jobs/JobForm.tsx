"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./RichTextEditor";
import { ImageUploader } from "./ImageUploader";
import type { Job, JobImage } from "@/lib/jobs/types";

type JobStatus = Job["status"];

function extractYouTubeId(url: string): string {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? "";
}

interface JobFormProps {
  job?: Job;
  onSave: (data: {
    title: string;
    description: string;
    requirements: string;
    tags: string[];
    images: JobImage[];
    video_url: string;
    status: JobStatus;
  }) => Promise<void>;
}

export function JobForm({ job, onSave }: JobFormProps) {
  const router = useRouter();
  const isEditing = Boolean(job);

  const [title, setTitle] = useState(job?.title ?? "");
  const [tags, setTags] = useState<string[]>([...(job?.tags ?? [])]);
  const [tagInput, setTagInput] = useState("");
  const [requirements, setRequirements] = useState(job?.requirements_input ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [images, setImages] = useState<JobImage[]>([...(job?.images ?? [])]);
  const [videoUrl, setVideoUrl] = useState(job?.video_url ?? "");
  const [status, setStatus] = useState<JobStatus>(job?.status ?? "active");
  const [showPreview, setShowPreview] = useState(false);

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Tag management ---

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function addTag() {
    const trimmed = tagInput.trim().replace(/,+$/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  // --- Image management ---

  const handleImageUpload = useCallback((url: string) => {
    setImages((prev) => {
      const isFirst = prev.length === 0;
      const filename = url.split("/").pop() ?? "image";
      return [...prev, { url, filename, is_main: isFirst }];
    });
  }, []);

  const handleImageDelete = useCallback((url: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.url !== url);
      // If we deleted the main image, make the first remaining one main
      const hasMain = filtered.some((img) => img.is_main);
      if (!hasMain && filtered.length > 0) {
        return filtered.map((img, i) => (i === 0 ? { ...img, is_main: true } : img));
      }
      return filtered;
    });
  }, []);

  const handleSetMain = useCallback((url: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_main: img.url === url,
      }))
    );
  }, []);

  // --- AI Generation ---

  async function handleGenerateAI() {
    if (!title.trim()) {
      setError("Please enter a job title before generating");
      return;
    }
    if (!requirements.trim()) {
      setError("Please enter requirements first so AI can generate a description");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          requirements: requirements.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Generation failed");
      }

      const generated = result.data?.description ?? result.description;
      if (generated) {
        setDescription(generated);
      } else {
        throw new Error("No description returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setGenerating(false);
    }
  }

  // --- Save ---

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        description,
        requirements,
        tags,
        images,
        video_url: videoUrl.trim(),
        status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">
              Job Title <span className="text-[#E10600]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder="e.g. Sim Racing Operator"
              className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E10600]/30 focus:border-[#E10600]"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">Tags</label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-[#F5F5F7] px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#E10600]/30 focus-within:border-[#E10600]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 text-primary/60 hover:text-primary transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                placeholder={tags.length === 0 ? "Type and press Enter to add tags" : "Add more..."}
                className="min-w-[120px] flex-1 bg-transparent py-0.5 text-[13px] focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Press Enter or comma to add a tag
            </p>
          </div>

          {/* Status toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={status === "active"}
                onChange={(e) => setStatus(e.target.checked ? "active" : "paused")}
                className="peer sr-only"
              />
              <div className="h-6 w-10 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-success peer-checked:after:translate-x-4" />
            </label>
            <span className="text-[13px] text-foreground">
              {status === "active" ? "Active (visible to applicants)" : "Paused (hidden)"}
            </span>
          </div>
        </div>

        {/* Requirements + AI Generate */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">Requirements</label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={4}
              placeholder={`Enter bullet points, e.g.:\n- Must have customer service experience\n- Available weekends\n- Physically able to set up equipment`}
              className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E10600]/30 focus:border-[#E10600] resize-y min-h-[100px]"
            />
            <p className="text-[10px] text-muted-foreground">
              Raw bullet points from admin. Used as input for AI description generation.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={generating || !requirements.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E10600] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {generating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                Generate with AI
              </>
            )}
          </button>
        </div>

        {/* Description (Rich Text) */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">Description</label>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            editable
            placeholder="Job description (use AI generate or type manually)..."
          />
          <p className="text-[10px] text-muted-foreground">
            Rich text description shown to applicants. Supports bold, italic, and bullet lists.
          </p>
        </div>

        {/* Job Post Image */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">Job Post Image</label>
          <p className="text-[10px] text-muted-foreground">
            The main image displayed on the job listing card. First image uploaded becomes the cover.
          </p>
          <ImageUploader
            images={images.filter((img) => img.is_main)}
            onUpload={(url) => {
              const filename = url.split("/").pop() ?? "image";
              setImages((prev) => {
                // Replace existing main image or add as first
                const withoutMain = prev.filter((img) => !img.is_main);
                return [{ url, filename, is_main: true }, ...withoutMain];
              });
            }}
            onDelete={(url) => {
              setImages((prev) => prev.filter((img) => img.url !== url));
            }}
            onSetMain={() => {}}
            jobId={job?.id}
          />
        </div>

        {/* Previous Events — Gallery */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">Previous Events</label>
            <p className="text-[10px] text-muted-foreground">
              Photos and videos from past events — shows applicants what the job looks like in action.
            </p>
          </div>

          {/* Gallery images */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.7px] text-muted-foreground">Photos</label>
            <ImageUploader
              images={images.filter((img) => !img.is_main)}
              onUpload={(url) => {
                const filename = url.split("/").pop() ?? "image";
                setImages((prev) => [...prev, { url, filename, is_main: false }]);
              }}
              onDelete={(url) => {
                setImages((prev) => prev.filter((img) => img.url !== url));
              }}
              onSetMain={() => {}}
              jobId={job?.id}
            />
          </div>

          {/* Gallery video */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.7px] text-muted-foreground">Video</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste a YouTube, Vimeo, or direct video URL"
              className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E10600]/30 focus:border-[#E10600]"
            />
            {videoUrl.trim() && (
              <div className="mt-2 overflow-hidden rounded-lg border border-border">
                {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}`}
                    className="aspect-video w-full"
                    allowFullScreen
                    title="Video preview"
                  />
                ) : videoUrl.includes("vimeo.com") ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${videoUrl.split("/").pop()}`}
                    className="aspect-video w-full"
                    allowFullScreen
                    title="Video preview"
                  />
                ) : (
                  <video src={videoUrl} controls className="w-full rounded-lg bg-black">
                    <track kind="captions" />
                  </video>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="flex-1 rounded-lg bg-[#E10600] py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Job"}
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="rounded-lg border border-border px-5 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-5 py-2.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        </div>

        {/* Preview Modal — shows what applicants see (dark theme) */}
        {/* Note: description HTML is admin-authored via Tiptap + OpenAI, not user-submitted */}
        {showPreview && (
          <JobPreviewModal
            title={title}
            tags={tags}
            description={description}
            images={images}
            videoUrl={videoUrl}
            onClose={() => setShowPreview(false)}
          />
        )}
      </form>
    </div>
  );
}

/* ─── Preview Modal ────────────────────────────────────────── */

function JobPreviewModal({
  title,
  tags,
  description,
  images,
  videoUrl,
  onClose,
}: {
  title: string;
  tags: string[];
  description: string;
  images: JobImage[];
  videoUrl: string;
  onClose: () => void;
}) {
  const mainImage = images.find((img) => img.is_main);
  const galleryImages = images.filter((img) => !img.is_main);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#0f172a] text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Preview badge */}
        <div className="absolute left-4 top-4 z-10 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Preview
        </div>

        {/* Cover image — natural aspect ratio */}
        {mainImage && (
          <img src={mainImage.url} alt="" className="w-full max-h-80 object-contain bg-black/50" />
        )}

        <div className="p-6 space-y-5">
          {/* Title + tags */}
          <div>
            <h2 className="text-2xl font-bold">{title || "Job Title"}</h2>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description — admin-authored content from Tiptap/OpenAI, not user-submitted */}
          {description && (
            <div
              className="prose prose-sm prose-invert max-w-none [&_strong]:text-white [&_p]:text-slate-300 [&_li]:text-slate-300 [&_ul]:pl-5 [&_ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}

          {/* Previous Events */}
          {(galleryImages.length > 0 || videoUrl.trim()) && (
            <div className="space-y-3 border-t border-white/10 pt-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Previous Events</h3>

              {/* Video */}
              {videoUrl.trim() && (
                <div className="overflow-hidden rounded-lg">
                  {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}`}
                      className="aspect-video w-full"
                      allowFullScreen
                      title="Event video"
                    />
                  ) : videoUrl.includes("vimeo.com") ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${videoUrl.split("/").pop()}`}
                      className="aspect-video w-full"
                      allowFullScreen
                      title="Event video"
                    />
                  ) : (
                    <video src={videoUrl} controls className="w-full rounded-lg bg-black">
                      <track kind="captions" />
                    </video>
                  )}
                </div>
              )}

              {/* Gallery — natural aspect ratios */}
              {galleryImages.length > 0 && (
                <div className="columns-2 gap-2 space-y-2">
                  {galleryImages.map((img) => (
                    <img key={img.url} src={img.url} alt="" className="w-full rounded-lg object-contain" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Apply button (decorative) */}
          <button type="button" disabled className="w-full rounded-lg bg-[#E10600] py-3 text-sm font-semibold text-white opacity-60">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}
