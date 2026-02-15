/**
 * Parse an image_url field that may be:
 * - null/undefined → []
 * - a single URL string → [url]
 * - a JSON-stringified array → parsed array
 */
export function parseImages(imageUrl: string | null | undefined): string[] {
  if (!imageUrl) return [];
  try {
    const parsed = JSON.parse(imageUrl);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Not JSON — treat as single URL
  }
  return [imageUrl];
}

/**
 * Get the first image URL from a potentially JSON-encoded image_url field.
 * Returns null if no images.
 */
export function firstImage(imageUrl: string | null | undefined): string | null {
  const images = parseImages(imageUrl);
  return images.length > 0 ? images[0] : null;
}

/**
 * Check if a URL is an external image (not hosted on our Supabase storage).
 * External images should use `unoptimized` with Next.js Image to avoid
 * the optimization proxy being blocked by external servers.
 */
export function isExternalImage(url: string | null | undefined): boolean {
  if (!url) return false;
  return !url.includes("supabase.co/");
}
