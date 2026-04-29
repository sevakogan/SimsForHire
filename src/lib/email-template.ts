/**
 * SimsForHire email templates
 *
 * buildEmailHtml()    — generic wrapper for job-application and misc emails
 * buildWaiverEmail()  — full Miami-themed waiver confirmation with reward cards + PDF callout
 */

// ─── Miami palette (matches Astro site registration email) ────────────────
const BLACK = "#0E0E0E";
const GRAY = "#8A8A8A";
const LIGHT = "#F5F4F0";
const RED = "#E10600";
const MIAMI_PINK = "#FF1B6B";
const MIAMI_TEAL = "#00C2C7";
const MIAMI_ORANGE = "#FF6B35";
const MIAMI_PINK_SOFT = "#FFE4ED";
const MIAMI_TEAL_SOFT = "#E0F7F8";
const MIAMI_ORANGE_SOFT = "#FFEDE5";

// ─── Generic shell (job applications, etc.) ──────────────────────────────
export function buildEmailHtml(bodyHtml: string, leadName?: string | null): string {
  const greeting = leadName ? `Hi ${leadName.split(" ")[0]},` : "Hi there,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SIMS FOR HIRE</title>
  <style>
    body { margin:0; padding:0; background:${LIGHT}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
    a { color:${MIAMI_TEAL}; text-decoration:none; }
  </style>
</head>
<body style="background:${LIGHT}; margin:0; padding:0;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BLACK}" style="background:${BLACK};">
      <tr>
        <td style="padding:38px 40px 30px;text-align:center;">
          <div style="font-size:22px;font-weight:800;letter-spacing:5px;color:#ffffff;text-transform:uppercase;">SIMS FOR HIRE</div>
          <div style="font-size:9px;font-weight:600;letter-spacing:4px;color:rgba(255,255,255,0.55);text-transform:uppercase;margin-top:4px;">PREMIUM RACING SIMULATORS</div>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td bgcolor="${MIAMI_PINK}" style="background:${MIAMI_PINK};height:5px;width:33.34%;font-size:1px;line-height:1;">&nbsp;</td>
        <td bgcolor="${MIAMI_ORANGE}" style="background:${MIAMI_ORANGE};height:5px;width:33.33%;font-size:1px;line-height:1;">&nbsp;</td>
        <td bgcolor="${MIAMI_TEAL}" style="background:${MIAMI_TEAL};height:5px;width:33.33%;font-size:1px;line-height:1;">&nbsp;</td>
      </tr>
    </table>
    <div style="padding:36px 40px 40px;">
      <p style="margin:0 0 20px 0;font-size:15px;color:${GRAY};">${greeting}</p>
      <div style="font-size:15px;line-height:1.7;color:${BLACK};">${bodyHtml}</div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BLACK}" style="background:${BLACK};">
      <tr>
        <td style="padding:28px 40px;text-align:center;">
          <div style="font-size:11px;letter-spacing:1px;color:rgba(255,255,255,0.65);margin-bottom:6px;">
            <a href="tel:7542285654" style="color:rgba(255,255,255,0.65);text-decoration:none;">(754) 228-5654</a>
            &nbsp;&middot;&nbsp;
            <a href="https://simsforhire.com" style="color:rgba(255,255,255,0.65);text-decoration:none;">simsforhire.com</a>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

// ─── Waiver confirmation — explicit dark neon design (immune to iOS dark mode inversion) ──
// Soft pastel backgrounds get inverted to muddy darks by iOS Mail dark mode.
// Fully dark design with vibrant neon accents stays exactly as intended on all clients.

export function buildWaiverEmail(
  signerName: string,
  eventName: string,
  dealerName: string,
): string {
  const first = signerName.split(" ")[0];

  // Explicit dark backgrounds — not inverted by iOS Mail dark mode
  const BG = "#0A0A0A";
  const CARD = "#161616";
  const BORDER = "#2A2A2A";
  const TEXT_PRIMARY = "#FFFFFF";
  const TEXT_SECONDARY = "#AAAAAA";

  // Neon card tints — dark enough that iOS won't invert, bright enough to feel Miami
  const TEAL_BG = "#071A1B";
  const PINK_BG = "#1A070D";
  const ORANGE_BG = "#1A0D04";

  return `<!DOCTYPE html>
<html style="color-scheme:dark;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:0 auto;background:${BG};">

    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BG}" style="background:${BG};">
      <tr>
        <td style="padding:40px 40px 28px;text-align:center;">
          <div style="font-size:22px;font-weight:800;letter-spacing:5px;color:${TEXT_PRIMARY};text-transform:uppercase;">SIMS FOR HIRE</div>
          <div style="font-size:9px;font-weight:600;letter-spacing:4px;color:${TEXT_SECONDARY};text-transform:uppercase;margin-top:5px;">PREMIUM RACING SIMULATORS</div>
        </td>
      </tr>
    </table>
    <!-- Miami stripe -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td bgcolor="${MIAMI_PINK}" style="background:${MIAMI_PINK};height:5px;width:33.34%;font-size:1px;line-height:1;">&nbsp;</td>
        <td bgcolor="${MIAMI_ORANGE}" style="background:${MIAMI_ORANGE};height:5px;width:33.33%;font-size:1px;line-height:1;">&nbsp;</td>
        <td bgcolor="${MIAMI_TEAL}" style="background:${MIAMI_TEAL};height:5px;width:33.33%;font-size:1px;line-height:1;">&nbsp;</td>
      </tr>
    </table>

    <!-- Breadcrumb -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BG}" style="background:${BG};">
      <tr>
        <td style="padding:20px 40px 0;text-align:center;">
          <div style="font-size:10px;letter-spacing:3px;color:${TEXT_SECONDARY};text-transform:uppercase;font-weight:600;">
            ${dealerName}&nbsp;&middot;&nbsp;${eventName}
          </div>
        </td>
      </tr>
    </table>

    <!-- Hero -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BG}" style="background:${BG};">
      <tr>
        <td style="padding:36px 40px 0;text-align:center;">
          <div style="display:inline-block;padding:8px 20px;background:${MIAMI_TEAL};font-size:10px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#ffffff;margin-bottom:22px;">
            Waiver On File
          </div>
          <div style="font-size:38px;font-weight:800;color:${TEXT_PRIMARY};margin:0 0 12px;letter-spacing:-1px;line-height:1.1;">
            Thanks, ${first}.
          </div>
          <div style="font-size:15px;line-height:1.7;color:${TEXT_SECONDARY};max-width:400px;margin:0 auto 32px;">
            Your waiver is signed and on file. Your signed copy is attached as a PDF below.
          </div>
        </td>
      </tr>
    </table>

    <!-- PDF callout -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BG}" style="background:${BG};padding:0 40px;">
      <tr>
        <td style="padding:0 0 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td bgcolor="${MIAMI_TEAL}" style="background:${MIAMI_TEAL};padding:20px 24px;border-radius:4px;">
                <div style="font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.8);text-transform:uppercase;font-weight:800;margin-bottom:6px;">📎 Attached</div>
                <div style="font-size:16px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Your signed waiver + 3 reward codes</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:4px;">PDF · opens on iPhone, Android &amp; desktop</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Rewards header -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BG}" style="background:${BG};padding:0 40px;">
      <tr>
        <td style="padding-bottom:6px;">
          <div style="font-size:11px;letter-spacing:3px;color:${TEXT_PRIMARY};text-transform:uppercase;font-weight:800;">Your Three Perks</div>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:20px;">
          <div style="height:3px;width:48px;background:${MIAMI_PINK};font-size:1px;line-height:1;">&nbsp;</div>
        </td>
      </tr>
    </table>

    <!-- Reward 1: Shift Arcade — TEAL -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BG}" style="background:${BG};padding:0 40px;">
      <tr>
        <td style="padding-bottom:12px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td bgcolor="${TEAL_BG}" style="background:${TEAL_BG};border-left:5px solid ${MIAMI_TEAL};padding:20px 22px;">
                <div style="font-size:9px;letter-spacing:2px;color:${MIAMI_TEAL};text-transform:uppercase;font-weight:800;margin-bottom:8px;">01 · Shift Arcade Miami Wynwood</div>
                <div style="font-size:20px;font-weight:800;color:${TEXT_PRIMARY};margin-bottom:8px;letter-spacing:-0.3px;">$25 OFF your next session</div>
                <div style="font-size:13px;line-height:1.6;color:${TEXT_SECONDARY};margin-bottom:16px;">Premium motion sims, indoor lounge, full bar. Valid 60 days.</div>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td bgcolor="${MIAMI_TEAL}" style="background:${MIAMI_TEAL};padding:9px 16px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px;font-weight:800;letter-spacing:1.5px;color:#000000;">FANFESTMIAMI</td>
                    <td style="padding-left:14px;">
                      <a href="https://shiftarcademiami.com/?utm_source=waiver_email&utm_medium=email&utm_campaign=fanfestmiami" style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MIAMI_TEAL};text-decoration:underline;font-weight:800;">Book a session →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Reward 2: $1k credit — PINK -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BG}" style="background:${BG};padding:0 40px;">
      <tr>
        <td style="padding-bottom:12px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td bgcolor="${PINK_BG}" style="background:${PINK_BG};border-left:5px solid ${MIAMI_PINK};padding:20px 22px;">
                <div style="font-size:9px;letter-spacing:2px;color:${MIAMI_PINK};text-transform:uppercase;font-weight:800;margin-bottom:8px;">02 · Sims For Hire Event Credit</div>
                <div style="font-size:20px;font-weight:800;color:${TEXT_PRIMARY};margin-bottom:8px;letter-spacing:-0.3px;">$1,000 OFF your first event</div>
                <div style="font-size:13px;line-height:1.6;color:${TEXT_SECONDARY};margin-bottom:16px;">Hosting your own corporate event, brand activation, or trade show? $1,000 off your first SimsForHire booking.</div>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td bgcolor="${MIAMI_PINK}" style="background:${MIAMI_PINK};padding:9px 16px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px;font-weight:800;letter-spacing:1.5px;color:#ffffff;">OWN1000</td>
                    <td style="padding-left:14px;">
                      <a href="https://simsforhire.com/?utm_source=waiver_email&utm_medium=email&utm_campaign=own1000" style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MIAMI_PINK};text-decoration:underline;font-weight:800;">Get a quote →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Reward 3: $500 referral — ORANGE -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BG}" style="background:${BG};padding:0 40px;">
      <tr>
        <td style="padding-bottom:32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td bgcolor="${ORANGE_BG}" style="background:${ORANGE_BG};border-left:5px solid ${MIAMI_ORANGE};padding:20px 22px;">
                <div style="font-size:9px;letter-spacing:2px;color:${MIAMI_ORANGE};text-transform:uppercase;font-weight:800;margin-bottom:8px;">03 · Refer a Corporate Event</div>
                <div style="font-size:20px;font-weight:800;color:${TEXT_PRIMARY};margin-bottom:8px;letter-spacing:-0.3px;">$500 cash per referral</div>
                <div style="font-size:13px;line-height:1.6;color:${TEXT_SECONDARY};margin-bottom:16px;">Refer a brand or venue. When their booking lands over $3,000, you get $500 cash. Paid net-30 after their event. No cap.</div>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td bgcolor="${MIAMI_ORANGE}" style="background:${MIAMI_ORANGE};padding:9px 16px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px;font-weight:800;letter-spacing:1.5px;color:#000000;">REFER500</td>
                    <td style="padding-left:14px;">
                      <a href="mailto:hi@simsforhire.com?subject=Referral%20intro" style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MIAMI_ORANGE};text-decoration:underline;font-weight:800;">Send the intro →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Trust bar -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${CARD}" style="background:${CARD};border-top:1px solid ${BORDER};">
      <tr>
        <td style="padding:24px 40px;text-align:center;">
          <div style="font-size:9px;letter-spacing:3px;color:${TEXT_SECONDARY};text-transform:uppercase;font-weight:600;margin-bottom:16px;">As seen at</div>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="padding:0 4px;">
                <div style="border:1.5px solid ${MIAMI_PINK};padding:5px 11px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:${MIAMI_PINK};text-transform:uppercase;border-radius:100px;white-space:nowrap;">Hard Rock Miami</div>
              </td>
              <td style="padding:0 4px;">
                <div style="border:1.5px solid ${MIAMI_TEAL};padding:5px 11px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:${MIAMI_TEAL};text-transform:uppercase;border-radius:100px;white-space:nowrap;">Art Basel</div>
              </td>
              <td style="padding:0 4px;">
                <div style="border:1.5px solid ${RED};padding:5px 11px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:${RED};text-transform:uppercase;border-radius:100px;white-space:nowrap;">RedBull</div>
              </td>
              <td style="padding:0 4px;">
                <div style="border:1.5px solid ${MIAMI_ORANGE};padding:5px 11px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:${MIAMI_ORANGE};text-transform:uppercase;border-radius:100px;white-space:nowrap;">Vossen Wheels</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BG}" style="background:${BG};">
      <tr>
        <td style="padding:28px 40px;text-align:center;">
          <div style="font-size:13px;font-weight:700;letter-spacing:4px;color:${TEXT_PRIMARY};text-transform:uppercase;margin-bottom:12px;">SIMS FOR HIRE</div>
          <div style="font-size:11px;color:${TEXT_SECONDARY};margin-bottom:6px;">
            <a href="tel:7542285654" style="color:${TEXT_SECONDARY};text-decoration:none;">(754) 228-5654</a>
            &nbsp;&middot;&nbsp;
            <a href="https://simsforhire.com" style="color:${MIAMI_TEAL};text-decoration:none;">simsforhire.com</a>
            &nbsp;&middot;&nbsp;
            <a href="https://instagram.com/simsforhire" style="color:${TEXT_SECONDARY};text-decoration:none;">@simsforhire</a>
          </div>
          <div style="font-size:10px;color:#444444;margin-top:12px;line-height:1.5;">
            Retain this email as your legal record (Florida E-SIGN Act).
          </div>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`;
}
