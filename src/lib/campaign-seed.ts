/**
 * Campaign seed data — all 4 campaigns with full email copy
 * Run via POST /api/setup/seed-campaigns (protected by CRON_SECRET)
 */

export const CAMPAIGNS = [
  // ─────────────────────────────────────────────────────────────
  // 1. WELCOME / NURTURE  (touchpoints 78-87)
  // ─────────────────────────────────────────────────────────────
  {
    name: "Welcome & Nurture",
    type: "welcome_nurture",
    description: "10-email sequence sent to every new lead. Delivers discount, builds trust, drives to booking.",
    steps: [
      {
        step_number: 1,
        channel: "email",
        subject: "Welcome to SimsForHire — here's your $20 off",
        delay_hours: 0,
        body_html: `<p>We're so glad you reached out.</p>
<p>SimsForHire brings professional-grade sim racing simulators to your event — the same rigs used by F1 drivers and esports champions, right here in Miami.</p>
<p>As a thank you for your interest, here's <strong>$20 off your first session</strong>:</p>
<p style="margin:20px 0; padding:16px 20px; background:#F5F5F7; border-radius:10px; font-size:18px; font-weight:600; text-align:center; letter-spacing:1px;">WELCOME20</p>
<p>Use it when you book below. We'd love to have you behind the wheel.</p>`,
      },
      {
        step_number: 2,
        channel: "email",
        subject: "What to expect your first SimsForHire session",
        delay_hours: 24,
        body_html: `<p>First time in a full-motion racing simulator? Here's exactly what happens:</p>
<p><strong>1. Arrive &amp; Get Briefed</strong><br />Our host walks you through the rig — steering, pedals, seating position. Takes about 5 minutes.</p>
<p><strong>2. Choose Your Car &amp; Track</strong><br />Ferrari F1? Le Mans GT? Miami International Raceway? The choice is yours.</p>
<p><strong>3. Practice Laps</strong><br />You'll get warm-up laps at your own pace. No pressure — just feel the machine.</p>
<p><strong>4. Race</strong><br />Timed runs, head-to-head against friends, or solo time attack. Your call.</p>
<p><strong>5. See Your Data</strong><br />Lap times, sector analysis, speed traces. You'll know exactly where you gained and lost time.</p>
<p>Most first-timers are hooked by lap 3. We'll see you there.</p>`,
      },
      {
        step_number: 3,
        channel: "email",
        subject: "Which simulator is right for you?",
        delay_hours: 48,
        body_html: `<p>We run three different simulator tiers — here's a quick breakdown:</p>
<table style="width:100%; border-collapse:collapse; font-size:14px;">
  <tr style="border-bottom:2px solid #E5E5E7;">
    <th style="text-align:left; padding:10px 0; color:#86868B; font-weight:500;">Tier</th>
    <th style="text-align:left; padding:10px 0; color:#86868B; font-weight:500;">Experience</th>
    <th style="text-align:left; padding:10px 0; color:#86868B; font-weight:500;">Best For</th>
  </tr>
  <tr style="border-bottom:1px solid #F0F0F0;">
    <td style="padding:12px 0; font-weight:600;">Non-Motion</td>
    <td style="padding:12px 0; color:#86868B;">Fixed rig, full pedal set, direct drive wheel</td>
    <td style="padding:12px 0; color:#86868B;">First-timers, casual racers</td>
  </tr>
  <tr style="border-bottom:1px solid #F0F0F0;">
    <td style="padding:12px 0; font-weight:600;">Haptic</td>
    <td style="padding:12px 0; color:#86868B;">Seat vibration, force feedback, road feel</td>
    <td style="padding:12px 0; color:#86868B;">Enthusiasts, birthday groups</td>
  </tr>
  <tr>
    <td style="padding:12px 0; font-weight:600;">Ultimate</td>
    <td style="padding:12px 0; color:#86868B;">Full motion platform, 3-screen wrap, pro-grade</td>
    <td style="padding:12px 0; color:#86868B;">Serious drivers, corporate events</td>
  </tr>
</table>
<p style="margin-top:20px;">Not sure which to pick? <a href="https://simsforhire.com/book">Book a call</a> and we'll match you to the right rig.</p>`,
      },
      {
        step_number: 4,
        channel: "email",
        subject: "What Marco said after his first session",
        delay_hours: 96,
        body_html: `<p>Marco came in for his birthday last month. He'd never driven a sim rig before.</p>
<p>Here's what he told us afterward:</p>
<blockquote style="border-left:3px solid #E10600; padding-left:16px; margin:20px 0; color:#86868B; font-style:italic;">"I came in thinking it would be like a video game. I left completely humbled — and completely addicted. My lap times dropped 4 seconds over two hours. I've already booked my next session."</blockquote>
<p>That's pretty much what happens. The sim teaches you things about racing that you can't learn any other way — trail braking, weight transfer, finding the limit without consequences.</p>
<p>Ready to find your limit?</p>`,
      },
      {
        step_number: 5,
        channel: "email",
        subject: "\"Is sim racing hard?\" — the honest answer",
        delay_hours: 144,
        body_html: `<p>We get this question a lot. Here's the honest answer:</p>
<p><strong>It's not hard to start. It's hard to master.</strong></p>
<p>Within 10 minutes, you'll be driving lap after lap. Within an hour, you'll start noticing where you're braking too late, where you're understeering, where you're leaving time on the table.</p>
<p><strong>Some common concerns:</strong></p>
<p>🏎️ <strong>"I've never driven a race car before."</strong><br />Perfect. Neither had most of our regulars when they first showed up. Our host walks you through everything.</p>
<p>🤢 <strong>"Won't I get motion sickness?"</strong><br />Very rarely. The motion systems are tuned to match visual cues — most people are totally fine. We go slow until you're comfortable.</p>
<p>👥 <strong>"Is it fun in a group?"</strong><br />It's <em>more</em> fun in a group. Head-to-head racing is a completely different experience.</p>
<p>Still have questions? Just hit reply — we'll get back to you same day.</p>`,
      },
      {
        step_number: 6,
        channel: "email",
        subject: "Don't just take our word for it",
        delay_hours: 192,
        body_html: `<p>We've had over a thousand drivers come through our simulators. Here's what a few of them said on Google:</p>
<blockquote style="border-left:3px solid #E10600; padding-left:16px; margin:16px 0; color:#86868B; font-style:italic;">"The most immersive experience in Miami. Full stop. The motion rig is absolutely insane — felt like I was actually on track. Booked my next session before I even left." — Daniel R. ⭐⭐⭐⭐⭐</blockquote>
<blockquote style="border-left:3px solid #E10600; padding-left:16px; margin:16px 0; color:#86868B; font-style:italic;">"We brought our whole team for a corporate day. Everyone from our CEO to our interns had the time of their lives. Highly recommend for team events." — Sarah K. ⭐⭐⭐⭐⭐</blockquote>
<blockquote style="border-left:3px solid #E10600; padding-left:16px; margin:16px 0; color:#86868B; font-style:italic;">"Booked as a birthday surprise for my husband. He cried actual tears of joy. 10/10." — Elena M. ⭐⭐⭐⭐⭐</blockquote>
<p>Come see what the hype is about.</p>`,
      },
      {
        step_number: 7,
        channel: "email",
        subject: "Thinking about bringing your team?",
        delay_hours: 240,
        body_html: `<p>SimsForHire is one of Miami's most unique team-building experiences — and it works for groups of any size.</p>
<p>Here's how corporate events typically go:</p>
<ul style="color:#1D1D1F; line-height:1.8;">
  <li>Multiple simulators running simultaneously (up to 6 at once)</li>
  <li>Dedicated host managing the experience</li>
  <li>Live leaderboard — everyone sees the standings in real time</li>
  <li>Championship format: qualifying → head-to-head finals → podium</li>
  <li>Trophy presentation + photo moment</li>
</ul>
<p>We handle everything. You just show up.</p>
<p>Pricing is per-simulator per-hour. Groups of 6+ get discounted rates. <a href="https://simsforhire.com/corporate">Get a custom quote for your team →</a></p>`,
      },
      {
        step_number: 8,
        channel: "email",
        subject: "Weekend slots are filling up",
        delay_hours: 312,
        body_html: `<p>Just a heads up — our Saturday and Sunday slots for the next two weeks are going fast.</p>
<p>We typically sell out Friday–Sunday, and weekday sessions are the best way to guarantee availability.</p>
<p>If you've been thinking about it, now's a good time to lock in your slot. Your <strong>$20 off code (WELCOME20)</strong> is still valid.</p>
<p>Takes about 2 minutes to book:</p>`,
      },
      {
        step_number: 9,
        channel: "email",
        subject: "Your $20 off expires in 48 hours",
        delay_hours: 360,
        body_html: `<p>Quick reminder — your welcome discount <strong>WELCOME20</strong> expires in 48 hours.</p>
<p>It's $20 off any session booking. Just apply it at checkout.</p>
<p>We'd love to have you come in. If timing isn't right this week, the code still works — just don't wait too long.</p>`,
      },
      {
        step_number: 10,
        channel: "email",
        subject: "Last chance — and an open door",
        delay_hours: 432,
        body_html: `<p>This is the last email in our welcome sequence — we don't want to fill your inbox.</p>
<p>If you're still interested in booking, we're here. Just reply to this email or head to <a href="https://simsforhire.com/book">simsforhire.com/book</a>.</p>
<p>Your discount code <strong>WELCOME20</strong> is still good for another 24 hours.</p>
<p>Whatever happens — thanks for checking us out. Hope to see you on track.</p>
<p style="margin-top:24px; color:#86868B; font-size:14px;">— The SimsForHire team</p>`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. ABANDONED BOOKING RECOVERY (touchpoints 101-104)
  // ─────────────────────────────────────────────────────────────
  {
    name: "Abandoned Booking Recovery",
    type: "abandoned_booking",
    description: "3 emails sent when someone starts but doesn't complete a booking.",
    steps: [
      {
        step_number: 1,
        channel: "email",
        subject: "You left your session behind",
        delay_hours: 1,
        body_html: `<p>Looks like you started booking a session but didn't finish — no worries, it happens.</p>
<p>Your spot isn't locked in yet. If you want it, just head back and complete your booking:</p>
<p>If something came up or you had a question, just hit reply. We're quick to respond.</p>`,
      },
      {
        step_number: 2,
        channel: "email",
        subject: "Still thinking about it? Here's what you'd be stepping into",
        delay_hours: 24,
        body_html: `<p>In case it helps — a few things people tell us after their first session:</p>
<blockquote style="border-left:3px solid #E10600; padding-left:16px; margin:16px 0; color:#86868B; font-style:italic;">"I was nervous it wouldn't be worth it. It was absolutely worth it." — Alex T.</blockquote>
<blockquote style="border-left:3px solid #E10600; padding-left:16px; margin:16px 0; color:#86868B; font-style:italic;">"We booked for 2 hours. We stayed for 3. Couldn't pull ourselves away." — Chris M.</blockquote>
<p>Still have the slot available. Complete your booking whenever you're ready.</p>`,
      },
      {
        step_number: 3,
        channel: "email",
        subject: "Weekend slots are going fast",
        delay_hours: 72,
        body_html: `<p>Just checking in one last time — the slots you were looking at are still available, but weekends fill up quickly.</p>
<p>If you want to lock in your preferred time, now's the moment.</p>
<p>Have a question before you book? Reply here and we'll sort it out in minutes.</p>`,
      },
      {
        step_number: 4,
        channel: "sms",
        subject: "SMS: Booking not complete",
        delay_hours: 2,
        body_html: `Your booking at SimsForHire isn't complete yet — grab your slot before it's gone: simsforhire.com/book`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. POST-VISIT (touchpoints 129-138)
  // ─────────────────────────────────────────────────────────────
  {
    name: "Post-Visit",
    type: "post_visit",
    description: "10-email sequence triggered after a completed session. Gets reviews, drives rebooking.",
    steps: [
      {
        step_number: 1,
        channel: "email",
        subject: "How was your race today?",
        delay_hours: 1,
        body_html: `<p>Hope you had an incredible time today on track.</p>
<p>We put everything we have into making each session unforgettable — and we'd love to know how we did.</p>
<p>Your race report is being compiled. We'll send your lap times and sector data shortly.</p>
<p>Questions, feedback, or something we could do better? Just hit reply. We read everything.</p>`,
      },
      {
        step_number: 2,
        channel: "email",
        subject: "You raced with us — would you mind sharing?",
        delay_hours: 2,
        body_html: `<p>If you enjoyed your session today, we'd really appreciate a Google review.</p>
<p>It takes about 60 seconds and helps other racers find us.</p>
<p style="margin:24px 0;">
  <a href="https://g.page/r/simsforhire/review" style="display:inline-block; background:#1D1D1F; color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:500; text-decoration:none;">Leave a Google Review →</a>
</p>
<p>Thank you — it genuinely means a lot to a small team like ours.</p>`,
      },
      {
        step_number: 3,
        channel: "email",
        subject: "Your race data from today's session",
        delay_hours: 24,
        body_html: `<p>Here's a quick summary from your session today:</p>
<ul style="line-height:2;">
  <li>Your best lap time is in the books</li>
  <li>Keep an eye on your braking zones — that's where most time gets left on the table</li>
  <li>Sector 2 is usually where regulars make the biggest gains on their second visit</li>
</ul>
<p>Want to see exactly how much you can improve? Come back and race yourself. Most drivers drop 3–5 seconds on their second visit.</p>`,
      },
      {
        step_number: 4,
        channel: "email",
        subject: "Ready to beat your lap time? — $10 off your next session",
        delay_hours: 72,
        body_html: `<p>You left knowing where you could go faster. Now's the time to prove it.</p>
<p>Come back within the next 2 weeks and take <strong>$10 off</strong> your next session:</p>
<p style="margin:20px 0; padding:16px 20px; background:#F5F5F7; border-radius:10px; font-size:18px; font-weight:600; text-align:center; letter-spacing:1px;">COMEBACK10</p>`,
      },
      {
        step_number: 5,
        channel: "email",
        subject: "Tag us — we'd love to feature you",
        delay_hours: 72,
        body_html: `<p>Did you snap anything today? A cockpit selfie, a reaction clip, a podium moment?</p>
<p>Tag us on Instagram <a href="https://instagram.com/simsforhire">@simsforhire</a> — we feature customer content every week.</p>
<p>Best posts get shared to our 10k+ followers. Could be you this week.</p>`,
      },
      {
        step_number: 6,
        channel: "email",
        subject: "Bring a friend, both get $15 off",
        delay_hours: 120,
        body_html: `<p>Know someone who'd love this?</p>
<p>Refer a friend and when they book their first session, <strong>you both get $15 off</strong>.</p>
<p>Just share this link with them: <a href="https://simsforhire.com/book">simsforhire.com/book</a></p>
<p>Have them mention your name at booking — we'll apply the credit to both accounts.</p>`,
      },
      {
        step_number: 7,
        channel: "email",
        subject: "A quick question (takes 10 seconds)",
        delay_hours: 168,
        body_html: `<p>On a scale of 1–10, how likely are you to recommend SimsForHire to a friend?</p>
<p>Reply with your number — that's it. We read every response and take feedback seriously.</p>
<p style="color:#86868B; font-size:14px;">If anything wasn't perfect, we want to make it right.</p>`,
      },
      {
        step_number: 8,
        channel: "email",
        subject: "Thank you for racing with us",
        delay_hours: 168,
        body_html: `<p>We just wanted to say thank you.</p>
<p>Every session we run, we're trying to create something genuinely memorable. The fact that you chose to spend time with us means everything.</p>
<p>You're now in our <strong>Loyalty Program</strong> — every session you book earns you toward exclusive perks, priority booking, and session upgrades.</p>
<p>We hope to see you back on track soon.</p>
<p style="margin-top:24px; color:#86868B; font-size:14px;">— The SimsForHire team</p>`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. WIN-BACK (triggers on status → lost)
  // ─────────────────────────────────────────────────────────────
  {
    name: "Win-Back",
    type: "win_back",
    description: "1 warm email sent when a lead is marked as lost. Keeps the door open.",
    steps: [
      {
        step_number: 1,
        channel: "email",
        subject: "We hope to see you someday",
        delay_hours: 0,
        body_html: `<p>We noticed things didn't work out this time — and that's completely okay.</p>
<p>We'd still love to have you behind the wheel whenever the timing is right.</p>
<p>Here's everything you need to find us whenever you're ready:</p>
<ul style="line-height:2; color:#1D1D1F;">
  <li>📍 Miami, FL</li>
  <li>📞 <a href="tel:7866554411">(786) 655-4411</a></li>
  <li>🌐 <a href="https://simsforhire.com">simsforhire.com</a></li>
  <li>📸 <a href="https://instagram.com/simsforhire">@simsforhire</a></li>
</ul>
<p>No pressure, no follow-up emails after this. Just know the door is always open.</p>
<p>Hope to see you on track someday.</p>
<p style="margin-top:24px; color:#86868B; font-size:14px;">— The SimsForHire team</p>`,
      },
    ],
  },
];
