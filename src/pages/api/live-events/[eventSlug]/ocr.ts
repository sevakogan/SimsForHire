export const prerender = false
import type { APIRoute } from 'astro'
import { extractTimeFromImage } from '../../../../lib/s4m/ocr'

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { image } = body as { image?: string }

    if (!image) {
      return new Response(JSON.stringify({ error: 'Missing image data' }), { status: 400 })
    }

    const time = await extractTimeFromImage(image)

    if (!time) {
      return new Response(JSON.stringify({ error: 'Could not extract time from image' }), { status: 422 })
    }

    return new Response(JSON.stringify({ time }))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[OCR] Error:', message)
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
