import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic()
  }
  return client
}

/** Detect actual image type from base64 magic bytes */
function detectMimeType(base64: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  if (base64.startsWith('iVBOR')) return 'image/png'
  if (base64.startsWith('R0lGO')) return 'image/gif'
  if (base64.startsWith('UklGR')) return 'image/webp'
  return 'image/jpeg'
}

export async function extractTimeFromImage(
  base64: string,
): Promise<string | null> {
  const anthropic = getClient()
  const actualMime = detectMimeType(base64)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 50,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: actualMime,
            data: base64,
          },
        },
        {
          type: 'text',
          text: 'This is a racing simulator screenshot. Extract ONLY the lap time or race time. Return ONLY the time in M:SS.mmm format like 1:23.456 — nothing else, no extra text. If multiple times visible, return the fastest/best one.',
        },
      ],
    }],
  })

  const block = response.content.find(b => b.type === 'text')
  if (!block || block.type !== 'text') return null

  const raw = block.text.trim()

  // Validate it looks like a time (M:SS.mmm or SS.mmm)
  const timeMatch = raw.match(/\d{1,2}:\d{2}\.\d{2,3}/)
  if (timeMatch) return timeMatch[0]

  const secMatch = raw.match(/\d{2}\.\d{2,3}/)
  if (secMatch) return secMatch[0]

  console.warn('[OCR] Returned non-time text:', raw)
  return null
}
