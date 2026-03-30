/**
 * Branded SimsForHire email template
 * Clean Apple-style white layout — minimal, single column, DM Sans
 */

const BRAND = {
  name: "SimsForHire",
  red: "#E10600",
  address: "Miami, FL",
  phone: "(786) 655-4411",
  website: "simsforhire.com",
  booking: "https://simsforhire.com/book",
  instagram: "@simsforhire",
  instagramUrl: "https://instagram.com/simsforhire",
  email: "hello@simsforhire.com",
};

export function buildEmailHtml(bodyHtml: string, leadName?: string | null): string {
  const greeting = leadName ? `Hi ${leadName.split(" ")[0]},` : "Hi there,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${BRAND.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
    body { margin: 0; padding: 0; background: #F5F5F7; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    * { box-sizing: border-box; }
    a { color: ${BRAND.red}; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body style="background:#F5F5F7; margin:0; padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F5F7; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- LOGO -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#1D1D1F; border-radius:14px; padding: 12px 20px;">
                    <span style="font-family:'DM Sans',-apple-system,Arial,sans-serif; font-size:13px; font-weight:700; letter-spacing:2px; color:#FFFFFF; text-transform:uppercase;">S4H</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CARD -->
          <tr>
            <td style="background:#FFFFFF; border-radius:18px; padding:44px 48px; border:1px solid #E5E5E7;">

              <!-- Greeting -->
              <p style="margin:0 0 20px 0; font-size:15px; color:#86868B; font-weight:400;">${greeting}</p>

              <!-- Body -->
              <div style="font-size:16px; line-height:1.7; color:#1D1D1F; font-weight:400;">
                ${bodyHtml}
              </div>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;">
                <tr>
                  <td style="background:${BRAND.red}; border-radius:10px; padding:0;">
                    <a href="${BRAND.booking}" style="display:inline-block; padding:14px 28px; font-family:'DM Sans',-apple-system,Arial,sans-serif; font-size:15px; font-weight:500; color:#FFFFFF; text-decoration:none; letter-spacing:-0.2px;">Book a Session →</a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none; border-top:1px solid #F0F0F0; margin: 36px 0;" />

              <!-- Contact info -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px 0; font-size:13px; font-weight:600; color:#1D1D1F; letter-spacing:-0.2px;">${BRAND.name}</p>
                    <p style="margin:0 0 2px 0; font-size:13px; color:#86868B;">${BRAND.address}</p>
                    <p style="margin:0 0 2px 0; font-size:13px; color:#86868B;">
                      <a href="tel:${BRAND.phone.replace(/\D/g,"")}" style="color:#86868B;">${BRAND.phone}</a>
                    </p>
                    <p style="margin:0 0 2px 0; font-size:13px;">
                      <a href="https://${BRAND.website}" style="color:${BRAND.red};">${BRAND.website}</a>
                    </p>
                    <p style="margin:0; font-size:13px;">
                      <a href="${BRAND.instagramUrl}" style="color:${BRAND.red};">${BRAND.instagram}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0; font-size:12px; color:#AEAEB2; line-height:1.6;">
                You're receiving this because you expressed interest in SimsForHire.<br />
                Questions? Reply to this email or reach us at <a href="mailto:${BRAND.email}" style="color:#AEAEB2;">${BRAND.email}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
