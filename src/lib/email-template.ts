/**
 * Branded SimsForHire email template — Miami dark theme
 * Matches the registration email design used on the live event Astro site.
 */

const MIAMI_PINK = "#FF1B6B";
const MIAMI_TEAL = "#00C2C7";
const MIAMI_ORANGE = "#FF6B35";

const BRAND = {
  name: "SIMS FOR HIRE",
  phone: "(754) 228-5654",
  website: "simsforhire.com",
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
    body { margin:0; padding:0; background:#0A0A0A; font-family:'DM Sans',-apple-system,BlinkMacSystemFont,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
    * { box-sizing:border-box; }
    a { color:${MIAMI_TEAL}; text-decoration:none; }
  </style>
</head>
<body style="background:#0A0A0A; margin:0; padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0A0A0A; padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- WORDMARK -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="font-family:'DM Sans',-apple-system,Arial,sans-serif; font-size:22px; font-weight:700; letter-spacing:5px; color:#FFFFFF; text-transform:uppercase;">${BRAND.name}</span>
            </td>
          </tr>

          <!-- MIAMI STRIPE -->
          <tr>
            <td style="padding-bottom:28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33%" height="3" style="background:${MIAMI_PINK};"></td>
                  <td width="34%" height="3" style="background:${MIAMI_ORANGE};"></td>
                  <td width="33%" height="3" style="background:${MIAMI_TEAL};"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CARD -->
          <tr>
            <td style="background:#161616; border-radius:16px; padding:40px 44px; border:1px solid #2A2A2A;">

              <!-- Greeting -->
              <p style="margin:0 0 20px 0; font-size:15px; color:#8A8A8A; font-weight:400;">${greeting}</p>

              <!-- Body -->
              <div style="font-size:15px; line-height:1.7; color:#E5E5E5; font-weight:400;">
                ${bodyHtml}
              </div>

              <!-- Divider -->
              <hr style="border:none; border-top:1px solid #2A2A2A; margin:32px 0;" />

              <!-- Contact info -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px 0; font-size:12px; font-weight:700; letter-spacing:3px; color:#FFFFFF; text-transform:uppercase;">${BRAND.name}</p>
                    <p style="margin:0 0 2px 0; font-size:12px; color:#8A8A8A;">
                      <a href="tel:${BRAND.phone.replace(/\D/g, "")}" style="color:#8A8A8A;">${BRAND.phone}</a>
                    </p>
                    <p style="margin:0 0 2px 0; font-size:12px;">
                      <a href="https://${BRAND.website}" style="color:${MIAMI_TEAL};">${BRAND.website}</a>
                    </p>
                    <p style="margin:0; font-size:12px;">
                      <a href="${BRAND.instagramUrl}" style="color:${MIAMI_TEAL};">${BRAND.instagram}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0; font-size:11px; color:#555555; line-height:1.6;">
                Retain this email as your legal record of agreement (Florida E-SIGN Act).<br />
                Questions? <a href="mailto:${BRAND.email}" style="color:#555555;">${BRAND.email}</a>
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
