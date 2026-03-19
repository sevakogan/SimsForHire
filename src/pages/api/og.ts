import satori from 'satori'
import { initWasm, Resvg } from '@resvg/resvg-wasm'
import type { APIRoute } from 'astro'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const prerender = false

let wasmInitialized = false

async function ensureWasm() {
  if (wasmInitialized) return
  const wasmPath = join(process.cwd(), 'node_modules', '@resvg', 'resvg-wasm', 'index_bg.wasm')
  const wasmBuffer = readFileSync(wasmPath)
  await initWasm(wasmBuffer)
  wasmInitialized = true
}

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  return res.arrayBuffer()
}

export const GET: APIRoute = async ({ url }) => {
  try {
    await ensureWasm()

    const title = url.searchParams.get('title') || 'WE BRING THE RACE TO YOU'
    const subtitle = url.searchParams.get('subtitle') || 'Full-motion racing simulators delivered to your event in Miami'

    const [fontDisplay, fontBody] = await Promise.all([
      loadFont('https://fonts.gstatic.com/s/bebasneue/v16/JTUSjIg69CK48gW7PXooxW4.ttf'),
      loadFont('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf'),
    ])

    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#0A0A0A',
            fontFamily: 'Inter',
            position: 'relative',
            textAlign: 'center' as const,
          },
          children: [
            // Red accent top bar
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '5px',
                  backgroundColor: '#E10600',
                  display: 'flex',
                },
              },
            },
            // Logo text
            {
              type: 'div',
              props: {
                style: {
                  fontFamily: 'Bebas Neue',
                  fontSize: 28,
                  color: '#E10600',
                  letterSpacing: '8px',
                  display: 'flex',
                  marginBottom: '30px',
                },
                children: 'SIMS FOR HIRE',
              },
            },
            // Divider
            {
              type: 'div',
              props: {
                style: {
                  width: '60px',
                  height: '3px',
                  backgroundColor: '#E10600',
                  display: 'flex',
                  marginBottom: '30px',
                },
              },
            },
            // Title
            {
              type: 'div',
              props: {
                style: {
                  fontFamily: 'Bebas Neue',
                  fontSize: title.length > 30 ? 64 : 80,
                  color: '#FFFFFF',
                  lineHeight: 0.95,
                  letterSpacing: '3px',
                  display: 'flex',
                  maxWidth: '900px',
                },
                children: title.toUpperCase(),
              },
            },
            // Subtitle
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 20,
                  color: '#888888',
                  display: 'flex',
                  maxWidth: '600px',
                  marginTop: '20px',
                },
                children: subtitle,
              },
            },
            // Bottom bar
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 50px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: { fontSize: 14, color: '#E10600', letterSpacing: '2px', display: 'flex' },
                      children: 'SIMSFORHIRE.COM',
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: { fontSize: 14, color: '#888888', display: 'flex' },
                      children: '(754) 228-5654 · Miami, FL',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Bebas Neue', data: fontDisplay, style: 'normal' as const, weight: 400 },
          { name: 'Inter', data: fontBody, style: 'normal' as const, weight: 400 },
        ],
      }
    )

    const resvg = new Resvg(svg, { fitTo: { mode: 'width' as const, value: 1200 } })
    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()

    return new Response(pngBuffer, {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
