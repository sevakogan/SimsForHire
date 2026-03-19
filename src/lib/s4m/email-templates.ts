import { getThemeByKey } from './themes'

const SFH_LOGO_URL = 'https://simsforhire.com/images/simsforhire-logo-white.png'

const BLACK = '#0E0E0E'
const GRAY = '#8A8A8A'
const LIGHT = '#F5F4F0'

export interface EmailBranding {
  themeColor?: string
  brandLogoUrl?: string
  sponsorLogos?: string[]
  eventSlug?: string
}

function layout(content: string, options: { dealerName?: string; eventName?: string } & EmailBranding = {}) {
  const dealer = options.dealerName || 'Sims For Hire'
  const event = options.eventName || 'Simulator Challenge'
  const accent = options.themeColor || '#FFE400'
  const brandLogo = options.brandLogoUrl || ''
  const sponsors = (options.sponsorLogos || []).filter(Boolean)

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${LIGHT};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:white;">

    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="background:#000000;">
      <tr>
        <td style="padding:28px 36px;text-align:center;background:#000000;">
          ${brandLogo ? `<img src="${brandLogo}" alt="${dealer}" style="max-height:80px;max-width:200px;width:auto;object-fit:contain;display:block;margin:0 auto 16px;" />` : ''}
          <div style="font-size:16px;font-weight:800;letter-spacing:3px;color:#ffffff;text-transform:uppercase;">${dealer}</div>
          <div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.3);margin-top:4px;text-transform:uppercase;">${event}</div>
        </td>
      </tr>
    </table>

    <!-- Content -->
    <div style="padding:36px;">
      ${content}
    </div>

    ${sponsors.length > 0 ? `
    <!-- Sponsor logos -->
    <div style="background:${LIGHT};padding:20px 36px;text-align:center;border-top:1px solid #E5E4E0;">
      <div style="font-size:9px;letter-spacing:2px;color:${GRAY};text-transform:uppercase;margin-bottom:14px;">Presented By</div>
      <div style="text-align:center;">
        ${sponsors.map(src => `<img src="${src}" alt="" style="max-height:36px;max-width:90px;width:auto;object-fit:contain;opacity:0.8;display:inline-block;margin:0 10px;" />`).join('')}
      </div>
    </div>` : ''}

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="background:#000000;">
      <tr>
        <td style="padding:24px 36px;text-align:center;background:#000000;">
          <div style="margin-bottom:14px;">
            <img src="${SFH_LOGO_URL}" alt="Sims For Hire" width="160" style="display:block;margin:0 auto;opacity:0.9;" />
          </div>
          <div style="font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:5px;">(786) 655-4411</div>
          <div style="font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.3);text-transform:uppercase;margin-bottom:5px;">simsforhire.com</div>
          <div style="font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.2);text-transform:uppercase;">
            <a href="https://www.instagram.com/simsforhire/" style="color:rgba(255,255,255,0.3);text-decoration:none;">@simsforhire</a>
          </div>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`
}

export function registrationEmail(
  name: string,
  queuePos: number,
  dealerName: string,
  eventName?: string,
  branding?: EmailBranding,
) {
  const accent = branding?.themeColor || '#FFE400'

  return layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:56px;height:56px;border:2px solid ${accent};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:24px;color:${accent};">&#x2713;</div>
    </div>

    <h1 style="font-size:28px;font-weight:300;color:${BLACK};text-align:center;margin:0 0 8px;">
      You're <em>confirmed</em>, ${name}!
    </h1>

    <p style="font-size:12px;letter-spacing:2px;color:${GRAY};text-align:center;text-transform:uppercase;margin:0 0 28px;">
      ${dealerName} ${eventName || 'Simulator Challenge'}
    </p>

    <div style="background:${accent};padding:20px 24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:10px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;margin-bottom:6px;">Total People in Queue</div>
      <div style="font-size:36px;font-weight:600;color:${BLACK};">${String(queuePos).padStart(2, '0')}</div>
    </div>

    <div style="border:2px solid ${BLACK};padding:20px 24px;margin-bottom:24px;">
      <div style="font-size:10px;letter-spacing:3px;color:${GRAY};text-transform:uppercase;margin-bottom:8px;">Important</div>
      <p style="font-size:13px;line-height:1.7;color:${BLACK};margin:0;">
        Please stand in line and wait to be called. <strong>If your turn is missed you will have to get in the back of the line unfortunately.</strong>
      </p>
    </div>

    <p style="font-size:12px;line-height:1.8;color:${GRAY};text-align:center;">
      Your results will be texted and emailed after your run. Good luck!
    </p>
  `, { dealerName, eventName, ...branding, themeColor: accent })
}

export function resultsEmail(
  name: string,
  lapTime: string,
  position: number,
  dealerName: string,
  eventName?: string,
  branding?: EmailBranding,
) {
  const isPodium = position <= 3
  const positionLabel = position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : `P${position}`
  const accent = branding?.themeColor || '#FFE400'
  const leaderboardUrl = branding?.eventSlug
    ? `https://simsforhire.com/races/live/${branding.eventSlug}/leaderboard`
    : 'https://simsforhire.com'

  return layout(`
    <h1 style="font-size:28px;font-weight:300;color:${BLACK};text-align:center;margin:0 0 8px;">
      Great run, ${name}!
    </h1>

    <p style="font-size:12px;letter-spacing:2px;color:${GRAY};text-align:center;text-transform:uppercase;margin:0 0 28px;">
      ${dealerName} ${eventName || 'Simulator Challenge'}
    </p>

    <div style="background:${BLACK};padding:28px 24px;text-align:center;margin-bottom:4px;">
      <div style="font-size:10px;letter-spacing:4px;color:rgba(255,255,255,0.3);text-transform:uppercase;margin-bottom:10px;">Your Lap Time</div>
      <div style="font-size:42px;font-weight:600;color:${accent};letter-spacing:2px;">${lapTime}</div>
    </div>

    <div style="background:${isPodium ? accent : LIGHT};padding:20px 24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:10px;letter-spacing:3px;color:${isPodium ? 'rgba(0,0,0,0.4)' : GRAY};text-transform:uppercase;margin-bottom:6px;">Leaderboard Position</div>
      <div style="font-size:32px;font-weight:600;color:${BLACK};">${positionLabel}</div>
      ${isPodium ? '<div style="font-size:11px;letter-spacing:2px;color:rgba(0,0,0,0.5);margin-top:6px;text-transform:uppercase;">Podium finish!</div>' : ''}
    </div>

    <p style="font-size:12px;line-height:1.8;color:${GRAY};text-align:center;">
      Check the leaderboard screen to see where you rank!<br>
      <a href="${leaderboardUrl}" style="color:${BLACK};text-decoration:underline;">View Live Leaderboard</a>
    </p>
  `, { dealerName, eventName, ...branding, themeColor: accent })
}

export function registrationPlainText(
  name: string,
  queuePos: number,
  dealerName: string,
  eventName?: string,
): string {
  const event = eventName || 'Simulator Challenge'
  return [
    `You're confirmed, ${name}!`,
    `${dealerName} ${event}`,
    '',
    `Total People in Queue: ${String(queuePos).padStart(2, '0')}`,
    '',
    'IMPORTANT: Please stand in line and wait to be called. If your turn is missed you will have to get in the back of the line.',
    '',
    'Your results will be texted and emailed after your run. Good luck!',
    '',
    '---',
    'Sims For Hire | simsforhire.com | (786) 655-4411',
    '@simsforhire',
  ].join('\n')
}

export function resultsPlainText(
  name: string,
  lapTime: string,
  position: number,
  dealerName: string,
  eventName?: string,
  eventSlug?: string,
): string {
  const event = eventName || 'Simulator Challenge'
  const isPodium = position <= 3
  const positionLabel = position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : `P${position}`
  const leaderboardUrl = eventSlug
    ? `https://simsforhire.com/races/live/${eventSlug}/leaderboard`
    : 'https://simsforhire.com'

  return [
    `Great run, ${name}!`,
    `${dealerName} ${event}`,
    '',
    `Your Lap Time: ${lapTime}`,
    `Leaderboard Position: ${positionLabel}${isPodium ? ' — Podium finish!' : ''}`,
    '',
    'Check the leaderboard screen to see where you rank!',
    leaderboardUrl,
    '',
    '---',
    'Sims For Hire | simsforhire.com | (786) 655-4411',
    '@simsforhire',
  ].join('\n')
}

export { getThemeByKey }
