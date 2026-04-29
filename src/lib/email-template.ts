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

// ─── Waiver confirmation email (full Miami template with rewards + PDF callout) ──

export function buildWaiverEmail(
  signerName: string,
  eventName: string,
  dealerName: string,
): string {
  const first = signerName.split(" ")[0];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:${LIGHT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BLACK};-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">

    <!-- Header wordmark on black -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BLACK}" style="background:${BLACK};">
      <tr>
        <td style="padding:38px 40px 30px;text-align:center;background:${BLACK};">
          <div style="font-size:22px;font-weight:800;letter-spacing:5px;color:#ffffff;text-transform:uppercase;">SIMS FOR HIRE</div>
          <div style="font-size:9px;font-weight:600;letter-spacing:4px;color:rgba(255,255,255,0.55);text-transform:uppercase;margin-top:4px;">PREMIUM RACING SIMULATORS</div>
        </td>
      </tr>
    </table>
    <!-- Miami sunset stripe -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td bgcolor="${MIAMI_PINK}" style="background:${MIAMI_PINK};height:6px;line-height:1;font-size:1px;width:33.34%;">&nbsp;</td>
        <td bgcolor="${MIAMI_ORANGE}" style="background:${MIAMI_ORANGE};height:6px;line-height:1;font-size:1px;width:33.33%;">&nbsp;</td>
        <td bgcolor="${MIAMI_TEAL}" style="background:${MIAMI_TEAL};height:6px;line-height:1;font-size:1px;width:33.33%;">&nbsp;</td>
      </tr>
    </table>

    <!-- Event breadcrumb -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:18px 40px 0;text-align:center;">
          <div style="font-size:10px;letter-spacing:3px;color:${GRAY};text-transform:uppercase;font-weight:600;">
            ${dealerName}&nbsp;&middot;&nbsp;${eventName}
          </div>
        </td>
      </tr>
    </table>

    <!-- Main content -->
    <div style="padding:32px 40px 40px;">

      <!-- Hero -->
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;padding:7px 16px;background:${MIAMI_TEAL};font-size:10px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#ffffff;margin-bottom:20px;border-radius:2px;">
          Waiver On File
        </div>
        <h1 style="font-size:36px;font-weight:800;color:${BLACK};margin:0 0 10px;letter-spacing:-1px;line-height:1.1;">
          Thanks, ${first}.
        </h1>
        <p style="font-size:15px;line-height:1.6;color:${GRAY};margin:0;max-width:420px;display:inline-block;">
          Your waiver is signed and on file. Your signed copy is attached as a PDF below.
        </p>
      </div>

      <!-- PDF attachment callout -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
        <tr>
          <td style="background:${MIAMI_TEAL};padding:20px 22px;color:#ffffff;">
            <div style="font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.85);text-transform:uppercase;margin-bottom:6px;font-weight:800;">📎 Attached</div>
            <div style="font-size:16px;font-weight:800;color:#ffffff;line-height:1.4;letter-spacing:-0.3px;">
              Your signed waiver + 3 reward codes
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:4px;">
              PDF · opens on iPhone, Android &amp; desktop
            </div>
          </td>
        </tr>
      </table>

      <!-- Three reward cards -->
      <div style="font-size:11px;letter-spacing:3px;color:${BLACK};text-transform:uppercase;font-weight:800;margin-bottom:6px;">
        Your Three Perks
      </div>
      <div style="height:3px;width:48px;background:${MIAMI_PINK};margin-bottom:18px;font-size:1px;line-height:1;">&nbsp;</div>

      <!-- Reward 1: Shift Arcade — TEAL -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td style="background:${MIAMI_TEAL_SOFT};border-left:6px solid ${MIAMI_TEAL};padding:18px 22px;">
            <div style="font-size:9px;letter-spacing:2px;color:${MIAMI_TEAL};text-transform:uppercase;font-weight:800;margin-bottom:6px;">01 · Shift Arcade Miami Wynwood</div>
            <div style="font-size:20px;font-weight:800;color:${BLACK};margin-bottom:8px;letter-spacing:-0.3px;">$25 OFF your next session</div>
            <p style="font-size:13px;line-height:1.5;color:${BLACK};opacity:0.75;margin:0 0 14px;">
              Premium motion sims, indoor lounge, full bar. Valid 60 days.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${BLACK};padding:9px 16px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px;font-weight:800;letter-spacing:1.5px;color:${MIAMI_TEAL};">FANFESTMIAMI</td>
                <td style="padding-left:12px;">
                  <a href="https://shiftarcademiami.com/?utm_source=waiver_email&utm_medium=email&utm_campaign=fanfestmiami" style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${BLACK};text-decoration:underline;font-weight:800;">Book a session →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Reward 2: $1k event credit — PINK -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td style="background:${MIAMI_PINK_SOFT};border-left:6px solid ${MIAMI_PINK};padding:18px 22px;">
            <div style="font-size:9px;letter-spacing:2px;color:${MIAMI_PINK};text-transform:uppercase;font-weight:800;margin-bottom:6px;">02 · Sims For Hire Event Credit</div>
            <div style="font-size:20px;font-weight:800;color:${BLACK};margin-bottom:8px;letter-spacing:-0.3px;">$1,000 OFF your first event</div>
            <p style="font-size:13px;line-height:1.5;color:${BLACK};opacity:0.75;margin:0 0 14px;">
              Hosting your own corporate event, brand activation, or trade show? $1,000 off your first SimsForHire booking.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${BLACK};padding:9px 16px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px;font-weight:800;letter-spacing:1.5px;color:${MIAMI_PINK};">OWN1000</td>
                <td style="padding-left:12px;">
                  <a href="https://simsforhire.com/?utm_source=waiver_email&utm_medium=email&utm_campaign=own1000" style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${BLACK};text-decoration:underline;font-weight:800;">Get a quote →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Reward 3: $500 referral — ORANGE -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr>
          <td style="background:${MIAMI_ORANGE_SOFT};border-left:6px solid ${MIAMI_ORANGE};padding:18px 22px;">
            <div style="font-size:9px;letter-spacing:2px;color:${MIAMI_ORANGE};text-transform:uppercase;font-weight:800;margin-bottom:6px;">03 · Refer a Corporate Event</div>
            <div style="font-size:20px;font-weight:800;color:${BLACK};margin-bottom:8px;letter-spacing:-0.3px;">$500 cash per referral</div>
            <p style="font-size:13px;line-height:1.5;color:${BLACK};opacity:0.75;margin:0 0 14px;">
              Refer a brand or venue. When their booking lands over $3,000, you get $500 cash. Paid net-30 after their event. No cap.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${BLACK};padding:9px 16px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px;font-weight:800;letter-spacing:1.5px;color:${MIAMI_ORANGE};">REFER500</td>
                <td style="padding-left:12px;">
                  <a href="mailto:hi@simsforhire.com?subject=Referral%20intro" style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${BLACK};text-decoration:underline;font-weight:800;">Send the intro →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- As seen at trust bar -->
      <div style="text-align:center;border-top:1px solid #E5E4E0;padding-top:24px;">
        <div style="font-size:9px;letter-spacing:3px;color:${GRAY};text-transform:uppercase;font-weight:600;margin-bottom:14px;">As seen at</div>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td style="padding:0 4px;">
              <div style="background:${MIAMI_PINK_SOFT};border:1.5px solid ${MIAMI_PINK};padding:5px 12px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:${MIAMI_PINK};text-transform:uppercase;border-radius:100px;white-space:nowrap;">Hard Rock Miami</div>
            </td>
            <td style="padding:0 4px;">
              <div style="background:${MIAMI_TEAL_SOFT};border:1.5px solid ${MIAMI_TEAL};padding:5px 12px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:${MIAMI_TEAL};text-transform:uppercase;border-radius:100px;white-space:nowrap;">Art Basel</div>
            </td>
            <td style="padding:0 4px;">
              <div style="background:#FFE4E4;border:1.5px solid ${RED};padding:5px 12px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:${RED};text-transform:uppercase;border-radius:100px;white-space:nowrap;">RedBull</div>
            </td>
            <td style="padding:0 4px;">
              <div style="background:${MIAMI_ORANGE_SOFT};border:1.5px solid ${MIAMI_ORANGE};padding:5px 12px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:${MIAMI_ORANGE};text-transform:uppercase;border-radius:100px;white-space:nowrap;">Vossen Wheels</div>
            </td>
          </tr>
        </table>
      </div>

    </div>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BLACK}" style="background:${BLACK};">
      <tr>
        <td style="padding:32px 40px;text-align:center;background:${BLACK};">
          <div style="font-size:13px;font-weight:700;letter-spacing:4px;color:#ffffff;text-transform:uppercase;margin-bottom:16px;">
            SIMS FOR HIRE
          </div>
          <div style="font-size:11px;letter-spacing:1px;color:rgba(255,255,255,0.65);margin-bottom:6px;">
            <a href="tel:7542285654" style="color:rgba(255,255,255,0.65);text-decoration:none;">(754) 228-5654</a>
            &nbsp;&middot;&nbsp;
            <a href="https://simsforhire.com" style="color:rgba(255,255,255,0.65);text-decoration:none;">simsforhire.com</a>
          </div>
          <div style="font-size:11px;letter-spacing:1px;color:rgba(255,255,255,0.45);">
            <a href="https://www.instagram.com/simsforhire/" style="color:rgba(255,255,255,0.45);text-decoration:none;">@simsforhire</a>
          </div>
          <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:16px;line-height:1.5;">
            Retain this email as your legal record of agreement (Florida E-SIGN Act).
          </div>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`;
}
