// ===========================================================================
// Waiver PDF generator — attached to the registration confirmation email
// ===========================================================================
// Generates a one-or-two-page PDF with:
//   • Page 1: confirmation header + 3 reward codes (Shift Arcade, $1k credit, $500 referral)
//   • Page 2: full waiver text + signature image + audit trail
//
// Returns a Buffer suitable for Resend's `attachments[].content` (base64).
// ===========================================================================

import PDFDocument from 'pdfkit'

const BLACK = '#0E0E0E'
const GRAY = '#8A8A8A'
const LIGHT_GRAY = '#F5F4F0'
const BORDER = '#E5E4E0'

// Miami Race Week palette — matched to the email template
const MIAMI_PINK = '#FF1B6B'
const MIAMI_TEAL = '#00C2C7'
const MIAMI_ORANGE = '#FF6B35'

export interface WaiverPdfInput {
  name: string
  email?: string | null
  phone?: string | null
  signedAt: Date
  signedIp?: string | null
  signedUserAgent?: string | null
  waiverVersion?: number | null
  waiverText?: string | null
  signatureDataUrl?: string | null
  dealerName: string
  eventName: string
  /** Used in the PDF subtitle + filename. */
  eventSlug: string
}

/** Generate a PDF buffer for the waiver receipt. */
export async function generateWaiverPdf(input: WaiverPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 60, bottom: 60, left: 56, right: 56 },
      info: {
        Title: `Waiver & Rewards — ${input.dealerName} ${input.eventName}`,
        Author: 'Sims For Hire',
        Subject: `Waiver confirmation for ${input.name}`,
        Keywords: 'waiver, racing simulator, sims for hire',
        CreationDate: input.signedAt,
      },
      bufferPages: true,
    })

    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    drawPage1Rewards(doc, input)
    if (input.waiverText || input.signatureDataUrl) {
      doc.addPage()
      drawPage2Audit(doc, input)
    }

    doc.end()
  })
}

// ───────────────────────────────────────────────────────────────────────────
// Page 1 — Confirmation header + 3 reward boxes
// ───────────────────────────────────────────────────────────────────────────

function drawPage1Rewards(doc: PDFKit.PDFDocument, input: WaiverPdfInput) {
  const W = doc.page.width
  const margin = 56

  // ─── Brand wordmark (top) ───
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(BLACK)
    .text('SIMS FOR HIRE', margin, 60, { align: 'left', characterSpacing: 3 })

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(GRAY)
    .text('PREMIUM RACING SIMULATORS', margin, 86, { align: 'left', characterSpacing: 2 })

  // Miami sunset stripe — three solid bars that read as a tropical accent
  const stripeW = (W - margin * 2) / 3
  doc.rect(margin, 108, stripeW, 4).fill(MIAMI_PINK)
  doc.rect(margin + stripeW, 108, stripeW, 4).fill(MIAMI_ORANGE)
  doc.rect(margin + stripeW * 2, 108, stripeW, 4).fill(MIAMI_TEAL)

  // ─── Confirmation block ───
  let y = 145
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(GRAY)
    .text('WAIVER CONFIRMATION', margin, y, { characterSpacing: 3 })
  y += 22
  doc
    .font('Helvetica-Bold')
    .fontSize(28)
    .fillColor(BLACK)
    .text(`Thanks, ${input.name}.`, margin, y)
  y += 36
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(BLACK)
    .text(
      `Your waiver is on file for ${input.dealerName} · ${input.eventName}. ` +
        `Keep this PDF — it contains your reward codes and your signed waiver record.`,
      margin,
      y,
      { width: W - margin * 2, lineGap: 4 },
    )
  y += 60

  // ─── Reward boxes header ───
  doc.rect(margin, y, W - margin * 2, 1).fill(BORDER)
  y += 18
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(BLACK)
    .text('YOUR THREE PERKS', margin, y, { characterSpacing: 2 })
  y += 26

  // ─── Reward 1: Shift Arcade Miami — TEAL ───
  drawRewardBox(doc, {
    x: margin,
    y,
    w: W - margin * 2,
    h: 92,
    eyebrow: '01  ·  SHIFT ARCADE MIAMI WYNWOOD',
    headline: '$25 OFF YOUR NEXT SESSION',
    body:
      'Same premium motion sims, indoor lounge, full bar, leaderboards, group bookings. ' +
      'Bring this PDF or use the code at checkout. Valid 60 days from registration.',
    code: 'FANFESTMIAMI',
    accent: MIAMI_TEAL,
  })
  y += 108

  // ─── Reward 2: SimsForHire $1k self credit — PINK ───
  drawRewardBox(doc, {
    x: margin,
    y,
    w: W - margin * 2,
    h: 92,
    eyebrow: '02  ·  SIMS FOR HIRE EVENT CREDIT',
    headline: '$1,000 OFF YOUR FIRST EVENT',
    body:
      'Hosting your own corporate event, brand activation, hotel hospitality, or trade ' +
      'show? Get $1,000 off your first SimsForHire booking. No minimum spend.',
    code: 'OWN1000',
    accent: MIAMI_PINK,
  })
  y += 108

  // ─── Reward 3: SimsForHire $500 referral — ORANGE ───
  drawRewardBox(doc, {
    x: margin,
    y,
    w: W - margin * 2,
    h: 92,
    eyebrow: '03  ·  REFER A CORPORATE EVENT',
    headline: '$500 CASH PER REFERRAL',
    body:
      'Know a brand or venue planning an event? Refer them. When their booking lands ' +
      'over $3,000, you receive $500 cash (paid net-30 after their event). No cap.',
    code: 'REFER500',
    accent: MIAMI_ORANGE,
  })
  y += 108

  // ─── Footer note ───
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(GRAY)
    .text(
      'Codes are tied to your email and phone. Redeem at simsforhire.com or by texting (754) 228-5654. ' +
        'Full terms at simsforhire.com/terms.',
      margin,
      y + 8,
      { width: W - margin * 2, lineGap: 2, align: 'center' },
    )

  // Bottom contact strip
  drawFooter(doc, input)
}

interface RewardBoxOpts {
  x: number
  y: number
  w: number
  h: number
  eyebrow: string
  headline: string
  body: string
  code: string
  accent: string
}

function drawRewardBox(doc: PDFKit.PDFDocument, o: RewardBoxOpts) {
  // Outer frame
  doc.rect(o.x, o.y, o.w, o.h).fill('#FFFFFF')
  doc.rect(o.x, o.y, o.w, o.h).lineWidth(1.5).stroke(BLACK)

  // Left accent stripe
  doc.rect(o.x, o.y, 6, o.h).fill(o.accent)

  // Text column (left)
  const textX = o.x + 22
  const textW = o.w - 22 - 168 // leave 168px on the right for the code box

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(GRAY)
    .text(o.eyebrow, textX, o.y + 14, { width: textW, characterSpacing: 1.5 })
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(BLACK)
    .text(o.headline, textX, o.y + 30, { width: textW })
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(BLACK)
    .text(o.body, textX, o.y + 50, { width: textW, lineGap: 2 })

  // Code box (right)
  const codeX = o.x + o.w - 168 + 16
  const codeBoxX = o.x + o.w - 152
  const codeBoxY = o.y + 18
  const codeBoxW = 136
  const codeBoxH = o.h - 36

  doc.rect(codeBoxX, codeBoxY, codeBoxW, codeBoxH).fill(BLACK)
  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor('#FFFFFF')
    .text('USE CODE', codeBoxX, codeBoxY + 12, {
      width: codeBoxW,
      align: 'center',
      characterSpacing: 2,
    })
  doc
    .font('Courier-Bold')
    .fontSize(15)
    .fillColor(o.accent)
    .text(o.code, codeBoxX, codeBoxY + 28, {
      width: codeBoxW,
      align: 'center',
      characterSpacing: 1,
    })
}

// ───────────────────────────────────────────────────────────────────────────
// Page 2 — Full waiver text + signature + audit trail
// ───────────────────────────────────────────────────────────────────────────

function drawPage2Audit(doc: PDFKit.PDFDocument, input: WaiverPdfInput) {
  const W = doc.page.width
  const margin = 56

  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(BLACK)
    .text('SIMS FOR HIRE', margin, 60, { characterSpacing: 3 })
  doc.rect(margin, 95, W - margin * 2, 2).fill(BLACK)

  // Title
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(BLACK)
    .text('SIGNED LIABILITY WAIVER', margin, 115, { characterSpacing: 1 })

  // Subtitle
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(GRAY)
    .text(
      `${input.dealerName} · ${input.eventName} · Version ${input.waiverVersion ?? 'current'}`,
      margin,
      138,
    )

  // Waiver body
  let y = 168
  if (input.waiverText) {
    const body = stripHtml(input.waiverText).slice(0, 3500) // safety cap
    doc.font('Helvetica').fontSize(9.5).fillColor(BLACK)
    doc.text(body, margin, y, {
      width: W - margin * 2,
      lineGap: 2,
      paragraphGap: 8,
    })
    y = doc.y + 18
  }

  // ─── Signature panel ───
  doc.rect(margin, y, W - margin * 2, 130).lineWidth(1).stroke(BORDER)
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(GRAY)
    .text('SIGNED BY', margin + 16, y + 14, { characterSpacing: 1.5 })
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(BLACK)
    .text(input.name, margin + 16, y + 28)

  // Signature image (right side)
  if (input.signatureDataUrl?.startsWith('data:image/')) {
    try {
      const base64 = input.signatureDataUrl.split(',', 2)[1]
      if (base64) {
        const buf = Buffer.from(base64, 'base64')
        doc.image(buf, W - margin - 200 - 8, y + 16, {
          fit: [200, 90],
          align: 'right',
        })
      }
    } catch {
      // Best-effort — bad data URL just renders no signature
    }
  }

  // Audit details (bottom of signature panel)
  const auditY = y + 80
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(GRAY)
    .text(
      `Signed at:  ${input.signedAt.toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`,
      margin + 16,
      auditY,
    )
  if (input.signedIp) {
    doc.text(`IP: ${input.signedIp}`, margin + 16, auditY + 14)
  }
  if (input.email) {
    doc.text(`Email: ${input.email}`, margin + 16, auditY + 28)
  }

  drawFooter(doc, input)
}

function drawFooter(doc: PDFKit.PDFDocument, input: WaiverPdfInput) {
  const W = doc.page.width
  const H = doc.page.height
  const margin = 56
  const fy = H - 50

  doc.rect(margin, fy - 10, W - margin * 2, 1).fill(BORDER)
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(GRAY)
    .text(
      `simsforhire.com  ·  (754) 228-5654  ·  @simsforhire  ·  Generated ${input.signedAt.toISOString().slice(0, 10)}`,
      margin,
      fy,
      { width: W - margin * 2, align: 'center', characterSpacing: 1 },
    )
}

/** Strip HTML tags for plain-text rendering in the PDF. */
function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .trim()
}
