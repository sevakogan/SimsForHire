"use server";

interface ScrapeResult {
  title: string | null;
  description: string | null;
  images: string[];
  error: string | null;
}

const MAX_BODY_SIZE = 500_000; // 500KB limit
const FETCH_TIMEOUT = 10_000; // 10s

// Patterns for images we want to skip (tracking pixels, icons, logos)
const SKIP_IMAGE_PATTERNS = [
  /favicon/i,
  /logo/i,
  /icon/i,
  /sprite/i,
  /pixel/i,
  /tracking/i,
  /badge/i,
  /banner/i,
  /\.gif$/i,
  /\.svg$/i,
  /1x1/i,
  /spacer/i,
  /blank/i,
  /widget/i,
  /button/i,
  /share/i,
  /social/i,
  /facebook/i,
  /twitter/i,
  /pinterest/i,
  /instagram/i,
];

function shouldSkipImage(url: string): boolean {
  return SKIP_IMAGE_PATTERNS.some((pattern) => pattern.test(url));
}

function resolveUrl(src: string, baseUrl: string): string | null {
  try {
    if (src.startsWith("data:")) return null;
    if (src.startsWith("//")) return `https:${src}`;
    if (src.startsWith("http")) return src;
    return new URL(src, baseUrl).href;
  } catch {
    return null;
  }
}

function extractJsonLd(html: string): {
  title: string | null;
  description: string | null;
  images: string[];
} {
  const results = { title: null as string | null, description: null as string | null, images: [] as string[] };

  // Find all JSON-LD script blocks
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item["@type"] === "Product" || item["@type"]?.includes?.("Product")) {
          if (item.name && !results.title) results.title = item.name;
          if (item.description && !results.description) results.description = item.description;

          // Images can be string, array of strings, or array of objects
          if (item.image) {
            const imgs = Array.isArray(item.image) ? item.image : [item.image];
            for (const img of imgs) {
              const url = typeof img === "string" ? img : img?.url ?? img?.contentUrl;
              if (url && typeof url === "string") {
                results.images.push(url);
              }
            }
          }
        }
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  }

  return results;
}

function extractMetaContent(html: string, property: string): string | null {
  // Try property="..." format (Open Graph)
  const ogRegex = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const ogMatch = ogRegex.exec(html);
  if (ogMatch?.[1]) return ogMatch[1];

  // Try content before property
  const reverseRegex = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`,
    "i"
  );
  const reverseMatch = reverseRegex.exec(html);
  if (reverseMatch?.[1]) return reverseMatch[1];

  // Try name="..." format
  const nameRegex = new RegExp(
    `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const nameMatch = nameRegex.exec(html);
  if (nameMatch?.[1]) return nameMatch[1];

  // Try content before name
  const nameReverseRegex = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`,
    "i"
  );
  const nameReverseMatch = nameReverseRegex.exec(html);
  if (nameReverseMatch?.[1]) return nameReverseMatch[1];

  return null;
}

function extractTitle(html: string): string | null {
  const match = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return match?.[1]?.trim() ?? null;
}

function extractImgTags(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    const resolved = resolveUrl(src, baseUrl);
    if (!resolved) continue;
    if (shouldSkipImage(resolved)) continue;

    // Check for explicit small dimensions in the tag
    const fullTag = match[0];
    const widthMatch = /width=["']?(\d+)/.exec(fullTag);
    const heightMatch = /height=["']?(\d+)/.exec(fullTag);

    if (widthMatch && parseInt(widthMatch[1]) < 100) continue;
    if (heightMatch && parseInt(heightMatch[1]) < 100) continue;

    images.push(resolved);
  }

  return images;
}

function deduplicateImages(images: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const img of images) {
    // Normalize by removing query params for dedup comparison
    const normalized = img.split("?")[0].toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(img);
    }
  }

  return unique;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function scrapeProductUrl(url: string): Promise<ScrapeResult> {
  // Validate URL
  if (!url || typeof url !== "string") {
    return { title: null, description: null, images: [], error: "URL is required." };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return { title: null, description: null, images: [], error: "Invalid URL format." };
  }

  // Fetch the page
  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(parsedUrl.href, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SimsForHire/1.0; +https://simsforhire.com)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        title: null,
        description: null,
        images: [],
        error: `Could not fetch page (status ${response.status}).`,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return {
        title: null,
        description: null,
        images: [],
        error: "URL does not point to an HTML page.",
      };
    }

    // Read limited body
    const reader = response.body?.getReader();
    if (!reader) {
      return { title: null, description: null, images: [], error: "Could not read response." };
    }

    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    while (totalSize < MAX_BODY_SIZE) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.length;
    }

    reader.cancel();

    const decoder = new TextDecoder();
    html = chunks.map((c) => decoder.decode(c, { stream: true })).join("") + decoder.decode();
  } catch (err) {
    const message = err instanceof Error && err.name === "AbortError"
      ? "Request timed out. The page took too long to load."
      : "Could not fetch product info from this URL.";
    return { title: null, description: null, images: [], error: message };
  }

  const baseUrl = parsedUrl.href;

  // 1. Try JSON-LD first (most structured)
  const jsonLd = extractJsonLd(html);

  // 2. Extract Open Graph / meta tags
  const ogTitle = extractMetaContent(html, "og:title");
  const ogDescription = extractMetaContent(html, "og:description");
  const ogImage = extractMetaContent(html, "og:image");
  const metaDescription = extractMetaContent(html, "description");
  const pageTitle = extractTitle(html);

  // 3. Extract all <img> tags
  const imgTagImages = extractImgTags(html, baseUrl);

  // Build final results with priority: JSON-LD > OG > meta > HTML
  const title = jsonLd.title ?? ogTitle ?? pageTitle;
  const description = jsonLd.description ?? ogDescription ?? metaDescription;

  // Combine images: JSON-LD first, then OG image, then img tags
  const allImages: string[] = [...jsonLd.images];

  if (ogImage) {
    const resolved = resolveUrl(ogImage, baseUrl);
    if (resolved && !shouldSkipImage(resolved)) {
      allImages.push(resolved);
    }
  }

  allImages.push(...imgTagImages);

  // Deduplicate and limit to 8
  const finalImages = deduplicateImages(allImages).slice(0, 8);

  return {
    title: title ? decodeHtmlEntities(title) : null,
    description: description ? decodeHtmlEntities(description) : null,
    images: finalImages,
    error: null,
  };
}
