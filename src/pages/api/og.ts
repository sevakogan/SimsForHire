import satori from 'satori'
import { initWasm, Resvg } from '@resvg/resvg-wasm'
import type { APIRoute } from 'astro'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const prerender = false

let wasmInitialized = false

async function ensureWasm() {
  if (wasmInitialized) return
  const wasmPath = join(
    process.cwd(),
    'node_modules',
    '@resvg',
    'resvg-wasm',
    'index_bg.wasm'
  )
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

    const title = url.searchParams.get('title') || 'SIMSFORHIRE'
    const subtitle =
      url.searchParams.get('subtitle') ||
      'Premium Racing Simulators for Events'

    const [fontDisplay, fontBody] = await Promise.all([
      loadFont(
        'https://fonts.gstatic.com/s/bebasneue/v16/JTUSjIg69CK48gW7PXooxW4.ttf'
      ),
      loadFont(
        'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf'
      ),
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
            justifyContent: 'space-between',
            backgroundColor: '#0A0A0A',
            fontFamily: 'Inter',
            position: 'relative',
            overflow: 'hidden',
          },
          children: [
            // Top red accent bar
            {
              type: 'div',
              props: {
                style: {
                  width: '100%',
                  height: '4px',
                  background:
                    'linear-gradient(90deg, #E10600 0%, #B30500 50%, #E10600 100%)',
                  display: 'flex',
                },
              },
            },
            // Diagonal speed lines
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  background:
                    'repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(225,6,0,0.03) 40px, rgba(225,6,0,0.03) 42px)',
                  display: 'flex',
                },
              },
            },
            // Red glow top-right
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: '-80px',
                  right: '-80px',
                  width: '400px',
                  height: '400px',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(225,6,0,0.15) 0%, transparent 70%)',
                  display: 'flex',
                },
              },
            },
            // Red glow bottom-left
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  bottom: '-120px',
                  left: '-60px',
                  width: '350px',
                  height: '350px',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(225,6,0,0.08) 0%, transparent 70%)',
                  display: 'flex',
                },
              },
            },
            // Main content
            {
              type: 'div',
              props: {
                style: {
                  flex: '1',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  justifyContent: 'center',
                  padding: '60px 70px',
                  position: 'relative',
                },
                children: [
                  // Title
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontFamily: 'Bebas Neue',
                        fontSize: title.length > 20 ? 72 : 96,
                        color: '#FFFFFF',
                        lineHeight: 0.95,
                        letterSpacing: '-1px',
                        display: 'flex',
                        maxWidth: '900px',
                      },
                      children: title.toUpperCase(),
                    },
                  },
                  // Red line
                  {
                    type: 'div',
                    props: {
                      style: {
                        width: '80px',
                        height: '4px',
                        backgroundColor: '#E10600',
                        marginTop: '24px',
                        marginBottom: '20px',
                        display: 'flex',
                      },
                    },
                  },
                  // Subtitle
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: 22,
                        color: '#999999',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        maxWidth: '700px',
                      },
                      children: subtitle,
                    },
                  },
                ],
              },
            },
            // Bottom bar
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '24px 70px',
                  borderTop: '1px solid rgba(225,6,0,0.2)',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontFamily: 'Bebas Neue',
                        fontSize: 28,
                        color: '#FFFFFF',
                        letterSpacing: '1px',
                        display: 'flex',
                      },
                      children: 'SIMSFORHIRE',
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: 14,
                        color: '#666666',
                        letterSpacing: '3px',
                        display: 'flex',
                      },
                      children: 'MIAMI',
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: 14,
                        color: '#E10600',
                        letterSpacing: '2px',
                        display: 'flex',
                      },
                      children: 'SIMSFORHIRE.COM',
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
          {
            name: 'Bebas Neue',
            data: fontDisplay,
            style: 'normal' as const,
            weight: 400,
          },
          {
            name: 'Inter',
            data: fontBody,
            style: 'normal' as const,
            weight: 400,
          },
        ],
      }
    )

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width' as const, value: 1200 },
    })
    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()

    return new Response(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
