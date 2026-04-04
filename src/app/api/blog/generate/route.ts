import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";

// Auth: OIDC via `vercel env pull` (VERCEL_OIDC_TOKEN) — no API key needed.
// First use: enable AI Gateway at vercel.com/{team}/simsforhire-admin/settings → AI Gateway,
// then run `vercel env pull .env.local` locally to provision VERCEL_OIDC_TOKEN.

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  const { topic, title } = await req.json();
  if (!topic?.trim()) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  const prompt = `You are a content writer for SimsForHire, Miami's premier racing simulator rental company. Write a compelling blog post for our website.

Topic: ${topic}
${title ? `Suggested title: ${title}` : ""}

SimsForHire context:
- We rent full-motion racing simulators to corporate events, private parties, brand activations, and car dealerships in Miami
- We have up to 8 rigs (6 full-motion Sigma Integrale, 2 non-motion), Simucube 2 direct drive, triple 39" displays
- We've served 3,400+ racers at events like Art Basel Miami, Hard Rock Miami International Autodrome
- Monthly leasing starting at $2,700/mo for dealerships and venues
- Phone: (754) 228-5654

Return ONLY a JSON object with these exact fields (no markdown, no code blocks, just raw JSON):
{
  "title": "The blog post title (compelling, SEO-friendly)",
  "slug": "url-friendly-slug",
  "excerpt": "2-3 sentence summary for listing page (max 200 chars)",
  "body_html": "Full article as HTML using <h2>, <p>, <ul>, <li>, <strong> tags. 400-700 words. No <html>, <head>, or <body> tags. Make it engaging and useful.",
  "meta_title": "SEO title (50-60 chars)",
  "meta_description": "SEO description (120-160 chars)"
}`;

  try {
    // Plain "provider/model" string routes through Vercel AI Gateway automatically.
    // Dots in version number (4.5 not 4-5) per gateway slug rules.
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4.6",
      prompt,
    });

    const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.slug && parsed.title) {
      parsed.slug = slugify(parsed.title);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
