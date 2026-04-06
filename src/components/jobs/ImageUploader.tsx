"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { uploadImage } from "@/lib/actions/upload";
import { isExternalImage } from "@/lib/parse-images";
import type { JobImage } from "@/lib/jobs/types";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageUploaderProps {
  images: JobImage[];
  onUpload: (url: string) => void;
  onDelete: (url: string) => void;
  onSetMain: (url: string) => void;
  jobId?: string;
}

export function ImageUploader({
  images,
  onUpload,
  onDelete,
  onSetMain,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only JPG, PNG, and WEBP files are accepted";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be under 5MB";
    }
    return null;
  }

  async function processFile(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
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
      } else if (result.url) {
        onUpload(result.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      await processFile(file);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Thumbnails grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div
              key={img.url}
              className={`group relative overflow-hidden rounded-lg border-2 transition-colors ${
                img.is_main
                  ? "border-primary shadow-sm"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <Image
                src={img.url}
                alt="Job image"
                width={96}
                height={96}
                className="h-24 w-24 object-cover"
                unoptimized={isExternalImage(img.url)}
              />

              {/* Overlay controls */}
              <div className="absolute inset-0 flex flex-col items-end justify-between bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDelete(img.url)}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white shadow-sm transition-transform hover:scale-110"
                  title="Remove image"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Set as main button */}
                {!img.is_main && (
                  <button
                    type="button"
                    onClick={() => onSetMain(img.url)}
                    className="flex h-5 items-center gap-0.5 rounded-full bg-white/90 px-1.5 text-[9px] font-medium text-foreground shadow-sm transition-transform hover:scale-105"
                    title="Set as main image"
                  >
                    <svg className="h-3 w-3 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    Main
                  </button>
                )}
              </div>

              {/* Main badge */}
              {img.is_main && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 px-1.5 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wider text-white">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-6 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border/70 hover:border-primary/40 hover:bg-muted/30"
        }`}
      >
        {uploading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
            <p className="text-xs text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <svg
              className="h-6 w-6 text-muted-foreground/60"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">
                Drop images here or click to browse
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                JPG, PNG, WEBP up to 5MB each
              </p>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
