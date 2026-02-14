"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/auth-provider";

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
  bucket?: string;
}

export function MultiImageUpload({
  images,
  onChange,
  max = 8,
  bucket = "item-images",
}: MultiImageUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    if (!user) {
      setError("You must be logged in to upload images");
      return;
    }

    const remaining = max - images.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];

      for (const file of toUpload) {
        if (!file.type.startsWith("image/")) continue;

        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        const ext = file.name.split(".").pop() ?? "jpg";
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, compressed, {
            contentType: compressed.type,
            upsert: false,
          });

        if (uploadError) {
          setError(`Upload failed: ${uploadError.message}`);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  const canAddMore = images.length < max;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {/* Existing images */}
        {images.map((url, index) => (
          <div key={url} className="group relative">
            <Image
              src={url}
              alt={`Image ${index + 1}`}
              width={72}
              height={72}
              className="h-[72px] w-[72px] rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {/* Upload button */}
        {canAddMore && (
          <label className="flex h-[72px] w-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 transition-colors hover:border-primary/40 hover:bg-muted/20">
            {uploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            ) : (
              <>
                <svg className="h-5 w-5 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-[10px] text-muted-foreground/50">
                  {images.length}/{max}
                </span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
