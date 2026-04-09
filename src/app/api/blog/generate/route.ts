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

  const prompt = `You are a premium content writer for SimsForHire, Miami's premier racing simulator rental company. Write a compelling, beautifully formatted blog post.

Topic: ${topic}
${title ? `Suggested title: ${title}` : ""}

SimsForHire context:
- We rent full-motion racing simulators to corporate events, private parties, brand activations, and car dealerships in Miami & South Florida
- Fleet: up to 8 rigs (6 full-motion Sigma Integrale, 2 non-motion), Simucube 2 direct drive steering, triple 39" displays
- 3,400+ racers served at events like Art Basel Miami, Hard Rock Miami International Autodrome
- Monthly leasing from $2,700/mo for dealerships and venues
- Phone: (754) 228-5654 | Website: simsforhire.com

CRITICAL HTML FORMATTING RULES for body_html:
- Use <h2> for main section headings (3-5 sections per article)
- Use <h3> for sub-headings when needed
- Every paragraph in <p> tags with substantive content (3-5 sentences each)
- Use <strong> for key phrases, stats, and emphasis within paragraphs
- Use <ul><li> for lists (features, benefits, etc.) — at least one list per article
- Use <blockquote> for standout quotes or callout statements
- Use <hr> between major sections for visual separation
- Add an engaging intro paragraph before the first <h2>
- End with a clear CTA paragraph mentioning our phone number
- 600-1000 words, well-structured, scannable
- Tone: authoritative yet approachable, premium but not stuffy — think motorsport meets luxury events

EXAMPLE STRUCTURE:
<p>Engaging intro hook paragraph...</p>
<h2>First Section Heading</h2>
<p>Content paragraph with <strong>key points bolded</strong>...</p>
<p>Another paragraph...</p>
<ul><li>Benefit one</li><li>Benefit two</li></ul>
<hr>
<h2>Second Section Heading</h2>
<p>More content...</p>
<blockquote>A standout statement or stat</blockquote>
...etc

Return ONLY a JSON object (no markdown, no code fences, just raw JSON) with ALL of these fields:
{
  "title": "Compelling SEO-friendly title (50-70 chars)",
  "slug": "url-friendly-slug-max-80-chars",
  "category": "One of: Events, Simulators, Tips, Dealerships, News, Corporate, Technology",
  "excerpt": "2-3 sentence summary for listing cards (max 200 chars)",
  "body_html": "Full article as clean HTML per the formatting rules above",
  "meta_title": "SEO page title with primary keyword (50-60 chars) | SimsForHire",
  "meta_description": "SEO description with keyword + value prop + CTA (120-160 chars)",
  "focus_keyword": "Primary SEO keyword phrase (2-4 words, e.g. 'racing simulator rental miami')",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "author": "SimsForHire",
  "reading_time_min": 4,
  "image_prompts": [
    "Detailed image generation prompt for hero/featured image — describe a photorealistic scene related to the blog topic featuring racing simulators, events, or Miami settings. Be specific about lighting, composition, and mood.",
    "Second image prompt for mid-article visual — different angle or scene",
    "Third image prompt — detail shot or close-up related to the topic"
  ]
}

IMPORTANT: Every single field must be filled. Do not return null or empty values. The image_prompts should describe photorealistic scenes that a text-to-image AI can generate — be vivid and specific.`;

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
