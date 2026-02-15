"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { uploadImage } from "@/lib/actions/upload";
import { isExternalImage } from "@/lib/parse-images";

interface ImageUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

export function ImageUpload({ currentUrl, onUpload, onRemove }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append("file", compressed, file.name);

      const result = await uploadImage(formData);

      if (result.error) {
        setError(`Upload failed: ${result.error}`);
        return;
      }

      if (result.url) {
        setPreview(result.url);
        onUpload(result.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    onRemove();
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {preview ? (
        <div className="relative inline-block">
          <Image
            src={preview}
            alt="Item image"
            width={80}
            height={80}
            className="rounded-md border border-border object-cover"
            unoptimized={isExternalImage(preview)}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white shadow-sm"
          >
            ✕
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border/80 px-3 py-2 transition-colors hover:border-primary/50 hover:bg-muted/30">
          <svg
            className="h-4 w-4 shrink-0 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
            />
          </svg>
          <span className="text-xs text-muted-foreground">
            {uploading ? "Uploading…" : "Upload"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
