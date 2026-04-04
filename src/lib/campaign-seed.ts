/**
 * Campaign seed data — all 4 campaigns with full email copy
 * Run via POST /api/setup/seed-campaigns (protected by CRON_SECRET)
 *
 * Brand context:
 * - Premium professional-grade racing simulators (NOT arcade toys)
 * - Based in Wynwood, Miami
 * - Hardware: Simucube direct-drive, Heusinkveld pedals, Sparco seats, Sigma Integrale motion
 * - Clients: brands, businesses, corporate events, dealerships, venues, luxury properties
 * - Services: rentals (events), monthly leasing, sales + permanent installs
 * - {{first_name}} is substituted at send time from the lead's name
 */

const SIG = `<p style="margin-top:32px; padding-top:16px; border-top:1px solid #E5E5E7; color:#555; font-size:14px; line-height:1.9;">
<strong style="color:#1D1D1F;">Seva</strong><br>
CEO @ Sims For Hire<br>
The Best and Only Racing Simulators in South Florida<br>
<a href="tel:7542285654" style="color:#555; text-decoration:none;">754.228.5654</a><br>
<a href="https://simsforhire.com" style="color:#555; text-decoration:none;">simsforhire.com</a>
</p>`;

export const CAMPAIGNS = [
  // ─────────────────────────────────────────────────────────────
  // 1. WELCOME / NURTURE  (10 emails)
  // ─────────────────────────────────────────────────────────────
  {
    name: "Welcome & Nurture",
    type: "welcome_nurture",
    description: "10-email sequence sent to every new lead. Educates on the brand, builds trust, drives to a booking conversation.",
    steps: [
      {
        step_number: 1,
        channel: "email",
        subject: "Hi {{first_name}} — thanks for reaching out to Sims For Hire",
        delay_hours: 0,
        body_html: `<p>Hi {{first_name}},</p>
<p>Thanks for getting in touch. I'm Seva, the founder of Sims For Hire — and I'm glad you found us.</p>
<p>We design, operate, and deploy <strong>professional-grade racing simulators</strong> for events, brand activations, venues, and permanent installations across South Florida.</p>
<p>I want to be upfront about what we are: these are not arcade machines or consumer gaming rigs. We run commercial-grade hardware — the same caliber used in professional motorsport training — built for real-world events and high-traffic environments.</p>
<p>Whether you're planning a corporate event, a brand activation, or looking for a long-term install at your venue or dealership, we'd love to talk through what makes sense for you.</p>
<p>Reply to this email with a bit of detail on what you have in mind — or call me directly. Happy to answer any questions personally.</p>
${SIG}`,
      },
      {
        step_number: 2,
        channel: "email",
        subject: `What "professional-grade" actually means`,
        delay_hours: 24,
        body_html: `<p>There are a lot of "simulator rentals" out there. Here's what sets ours apart.</p>
<p>Every rig we deploy runs:</p>
<ul style="line-height:2;">
  <li><strong>Simucube 2 Sport direct-drive wheelbase</strong> — the same technology used in professional motorsport training. Force feedback so accurate you can feel the track surface and tire behavior.</li>
  <li><strong>Heusinkveld race pedals</strong> — hydraulic or load-cell precision, not cheap plastic levers.</li>
  <li><strong>Sparco racing seat</strong> — the same brand found in actual race cars.</li>
  <li><strong>Triple-screen or full-motion platform</strong> — immersive, high-engagement setups built for crowds.</li>
  <li><strong>Assetto Corsa + custom ShiftOS launcher</strong> — professionally curated car and track selection, configured before every event.</li>
</ul>
<p>The result is an experience people genuinely talk about. Not because it's a game — because it feels real.</p>
<p>Let me know if you'd like to see the hardware in action before committing to anything.</p>
${SIG}`,
      },
      {
        step_number: 3,
        channel: "email",
        subject: "Three ways to work with us",
        delay_hours: 48,
        body_html: `<p>We work with clients in three main ways. Here's a quick breakdown:</p>
<p><strong>1. Simulator Rentals</strong><br>
Short-term deployments for events, brand activations, corporate days, and pop-ups. We bring the hardware, handle setup and teardown, and staff the experience from start to finish. You show up — we handle everything else.</p>
<p><strong>2. Monthly Leasing</strong><br>
For venues, automotive dealerships, and businesses looking for an ongoing sim racing experience without ownership. We handle maintenance, service calls, and support throughout.</p>
<p><strong>3. Sales + Permanent Installs</strong><br>
For hotels, luxury properties, performance shops, and dealerships that want full ownership. We spec the right system for your space, handle installation and commissioning, and offer ongoing support plans.</p>
<p>Not sure which fits your situation? Just reply — happy to think through it with you.</p>
${SIG}`,
      },
      {
        step_number: 4,
        channel: "email",
        subject: "Who we work with",
        delay_hours: 96,
        body_html: `<p>Our clients come from a few distinct worlds — here's how sim racing serves each of them:</p>
<p><strong>Brands & Marketing Teams</strong><br>
Simulator activations drive serious engagement at events. Guests line up, they compete, they share. It's the kind of experience that stays with people — and associates your brand with something memorable.</p>
<p><strong>Automotive Dealerships</strong><br>
A professional simulator in a showroom or service lounge keeps customers engaged longer, differentiates you from competitors, and creates a natural touchpoint for launches, demo days, and promotions.</p>
<p><strong>Corporate Events</strong><br>
Head-to-head racing with live leaderboards makes for one of the most genuinely competitive and entertaining team experiences available. No experience needed — everyone's hooked by lap two.</p>
<p><strong>Luxury Venues & Hotels</strong><br>
A permanently installed simulator becomes an amenity guests talk about. We've built experiences for properties that want to offer something truly unique.</p>
<p>Whatever the context, we build something that works — and that actually performs in the real world.</p>
${SIG}`,
      },
      {
        step_number: 5,
        channel: "email",
        subject: "Full-motion vs. non-motion — which is right for your event?",
        delay_hours: 144,
        body_html: `<p>We offer two simulator configurations. Here's how to think about each:</p>
<p><strong>Non-Motion Simulators</strong><br>
A rigid, precision-built rig with our full hardware stack — Simucube direct-drive wheel, Heusinkveld pedals, triple screens. These are high-throughput and ideal for events where you want maximum uptime, fast driver rotation, and consistent performance. No physical movement means setup is streamlined and the experience is accessible to first-timers and enthusiasts alike.</p>
<p><strong>Full-Motion Simulators</strong><br>
Built on the Sigma Integrale motion platform, these physically respond to every braking zone, corner, and curb. The engagement level is noticeably different — guests feel the car. These rigs create the most memorable moments and the highest social content potential. Ideal for premium activations, VIP experiences, and events where impact matters most.</p>
<p>Both options are fully managed by our team on-site. Final recommendation depends on your event format, audience, and space — happy to advise once I know more about what you're planning.</p>
${SIG}`,
      },
      {
        step_number: 6,
        channel: "email",
        subject: "What's included when you work with us",
        delay_hours: 192,
        body_html: `<p>When you rent from Sims For Hire, here's exactly what we handle:</p>
<ul style="line-height:2;">
  <li><strong>Hardware delivery and setup</strong> — we bring everything and build it out before your event starts</li>
  <li><strong>On-site operator</strong> — a dedicated team member manages the simulator throughout your event, helps guests in, keeps the queue moving, and handles any technical needs</li>
  <li><strong>Software configuration</strong> — car selection, tracks, difficulty settings, and leaderboard all configured for your audience</li>
  <li><strong>Teardown and load-out</strong> — we pack everything up when the event ends</li>
  <li><strong>Custom branding</strong> — your logo and brand assets can be integrated into the experience (on-screen overlays, custom launcher screens)</li>
</ul>
<p>You don't need to think about any of it. That's the point.</p>
<p>Ready to get a quote? Just reply with your event date, location, and expected attendance — we'll put something together quickly.</p>
${SIG}`,
      },
      {
        step_number: 7,
        channel: "email",
        subject: "From Wynwood to wherever your event is",
        delay_hours: 240,
        body_html: `<p>We're based in Wynwood, Miami — and we deploy throughout South Florida and beyond.</p>
<p>Our simulators have been set up at:</p>
<ul style="line-height:2;">
  <li>Indoor event venues and convention spaces</li>
  <li>Automotive showrooms and dealership floors</li>
  <li>Outdoor activations and festival footprints</li>
  <li>Private properties, rooftop venues, and hotel ballrooms</li>
  <li>Corporate offices and brand HQ spaces</li>
</ul>
<p>We're experienced with complex load-ins, tight timelines, and non-standard spaces. If you have specific venue constraints or questions about logistics, that's worth a conversation before you commit to anything.</p>
<p>Happy to answer those directly — just reply or give me a call.</p>
${SIG}`,
      },
      {
        step_number: 8,
        channel: "email",
        subject: "What our clients say",
        delay_hours: 312,
        body_html: `<p>A few things we've heard from clients after their events:</p>
<blockquote style="border-left:3px solid #E10600; padding-left:16px; margin:20px 0; color:#555; font-style:italic;">"The simulator was the most-talked-about element of our entire activation. Guests were lining up the whole day. Seva and his team handled everything — we didn't have to think about it once."</blockquote>
<blockquote style="border-left:3px solid #E10600; padding-left:16px; margin:20px 0; color:#555; font-style:italic;">"We brought the sim into our showroom and it changed the dynamic completely. Customers spend more time on the floor, they ask more questions, and it gives us something to talk about that no other dealership has."</blockquote>
<blockquote style="border-left:3px solid #E10600; padding-left:16px; margin:20px 0; color:#555; font-style:italic;">"Our corporate event needed something that felt premium and actually got people competing. The leaderboard and head-to-head format was perfect. Will be using Sims For Hire again."</blockquote>
<p>If you'd like to talk through what a successful activation looks like for your specific situation, I'm happy to set up a quick call.</p>
${SIG}`,
      },
      {
        step_number: 9,
        channel: "email",
        subject: "A quick note on lead time",
        delay_hours: 360,
        body_html: `<p>We're currently booking events on a first-come, first-served basis — and key dates in South Florida fill up faster than most people expect.</p>
<p>If you have a date in mind, even a tentative one, it's worth getting on the calendar early. We can hold a date with no commitment while we finalize details.</p>
<p>Getting a quote is simple — just reply with:</p>
<ul style="line-height:2;">
  <li>Your event date (or approximate window)</li>
  <li>Location</li>
  <li>Expected attendance and format</li>
</ul>
<p>I'll get back to you within a few hours with a recommendation and a quote.</p>
${SIG}`,
      },
      {
        step_number: 10,
        channel: "email",
        subject: "Last note from me — the door is always open",
        delay_hours: 432,
        body_html: `<p>This is the last email in this sequence — I don't want to fill your inbox if the timing isn't right.</p>
<p>When you're ready to move forward — or even just want to ask a few questions — reach out directly:</p>
<ul style="line-height:2; list-style:none; padding:0;">
  <li>📞 <a href="tel:7542285654" style="color:#1D1D1F; text-decoration:none;">754.228.5654</a></li>
  <li>🌐 <a href="https://simsforhire.com" style="color:#1D1D1F; text-decoration:none;">simsforhire.com</a></li>
</ul>
<p>We'll be here.</p>
${SIG}`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. ABANDONED BOOKING RECOVERY (3 emails + 1 SMS)
  // ─────────────────────────────────────────────────────────────
  {
    name: "Abandoned Booking Recovery",
    type: "abandoned_booking",
    description: "3 emails + SMS sent when someone starts but doesn't complete a booking inquiry.",
    steps: [
      {
        step_number: 1,
        channel: "email",
        subject: "Did something come up?",
        delay_hours: 1,
        body_html: `<p>Looks like you started a booking inquiry but didn't finish — completely fine, these things happen.</p>
<p>If you had a question before committing, I'm the right person to ask. Just reply here and I'll get back to you quickly.</p>
<p>If you're ready to complete the inquiry, we can pick up right where you left off.</p>
${SIG}`,
      },
      {
        step_number: 2,
        channel: "sms",
        subject: "SMS: Inquiry not complete",
        delay_hours: 2,
        body_html: `Hi, it's Seva from Sims For Hire — noticed your booking inquiry didn't go through. Happy to help. Text back or call 754.228.5654`,
      },
      {
        step_number: 3,
        channel: "email",
        subject: "Any questions before you move forward?",
        delay_hours: 24,
        body_html: `<p>Sometimes there's a question holding things up — budget, logistics, timeline, what's actually included.</p>
<p>Happy to answer any of it directly. No pressure, no sales pitch — just a straight conversation about what makes sense for your event.</p>
<p>Reply here or give me a call whenever works.</p>
${SIG}`,
      },
      {
        step_number: 4,
        channel: "email",
        subject: "One last check-in",
        delay_hours: 72,
        body_html: `<p>Just one more note — if the timing isn't right, that's completely fine. We'll be here when it is.</p>
<p>If there's still interest, I'd love to hear what you're working on and see if we're the right fit. Dates fill up, especially around busy seasons in South Florida, so earlier is always better if you're planning something specific.</p>
<p>Either way — thanks for considering us.</p>
${SIG}`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. POST-VISIT (8 emails)
  // ─────────────────────────────────────────────────────────────
  {
    name: "Post-Visit",
    type: "post_visit",
    description: "8-email sequence triggered after a completed event. Gets reviews, drives rebooking and referrals.",
    steps: [
      {
        step_number: 1,
        channel: "email",
        subject: "Hope the event was a success",
        delay_hours: 1,
        body_html: `<p>Thanks for having us — it was great being part of your event.</p>
<p>If there's anything you need from our end — recap photos, any documentation, or just a debrief on how the experience went — don't hesitate to reach out.</p>
<p>We put a lot into every deployment. If there's anything we could have done better, I genuinely want to hear it.</p>
${SIG}`,
      },
      {
        step_number: 2,
        channel: "email",
        subject: "One quick favor — would you leave us a review?",
        delay_hours: 2,
        body_html: `<p>If you had a good experience with us, a Google review means a lot — especially for a team this size.</p>
<p>Takes about a minute, and it helps other event organizers and brands find us when they're looking for something that actually delivers.</p>
<p style="margin:24px 0;">
  <a href="https://g.page/r/simsforhire/review" style="display:inline-block; background:#1D1D1F; color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:500; text-decoration:none;">Leave a Google Review →</a>
</p>
<p>We appreciate it.</p>
${SIG}`,
      },
      {
        step_number: 3,
        channel: "email",
        subject: "Already thinking about the next one?",
        delay_hours: 24,
        body_html: `<p>A lot of our clients come back — and the second event is always smoother than the first because we already know your setup, your audience, and what works.</p>
<p>If you're planning something else — whether it's soon or months out — I'd rather hear about it early so we can hold the date and make sure the hardware you want is available.</p>
<p>What's next on your calendar?</p>
${SIG}`,
      },
      {
        step_number: 4,
        channel: "email",
        subject: "Have you considered a permanent install?",
        delay_hours: 72,
        body_html: `<p>If last night's event is any indication, your audience responds well to this kind of experience.</p>
<p>For businesses, venues, and dealerships with the right space, a permanently installed simulator can become one of the most engaging features you offer — generating foot traffic, extending dwell time, and giving guests something to talk about.</p>
<p>We spec, install, and support permanent setups from end to end. If that's ever been something you've thought about, worth a conversation.</p>
${SIG}`,
      },
      {
        step_number: 5,
        channel: "email",
        subject: "Tag us — we'd love to share your event",
        delay_hours: 72,
        body_html: `<p>If you got any photos or video from the event, we'd love to see it.</p>
<p>Tag us on Instagram <strong>@simsforhire</strong> — we regularly feature client events and activations across our channels. Great content from your event could reach the right people.</p>
<p>And if you have footage you'd like us to share more broadly, just send it over — happy to make it work for both of us.</p>
${SIG}`,
      },
      {
        step_number: 6,
        channel: "email",
        subject: "Know anyone else who'd benefit from this?",
        delay_hours: 120,
        body_html: `<p>Referrals are how most of our best partnerships start.</p>
<p>If you know another brand, business, or event team that could use what we do — a warm introduction goes a long way. We'll make sure they're taken care of, and we look after the people who send business our way.</p>
<p>Just reply with a name and I'll reach out directly, or feel free to give them my contact info.</p>
${SIG}`,
      },
      {
        step_number: 7,
        channel: "email",
        subject: "Quick question — how did we do?",
        delay_hours: 168,
        body_html: `<p>On a scale of 1–10, how likely are you to work with us again or recommend us?</p>
<p>Just reply with the number. That's it. No survey, no form.</p>
<p>If anything fell short, I want to know so we can fix it. If everything exceeded expectations, that's useful too — helps us understand what to double down on.</p>
${SIG}`,
      },
      {
        step_number: 8,
        channel: "email",
        subject: "You're part of the Sims For Hire network",
        delay_hours: 168,
        body_html: `<p>We genuinely appreciate you choosing us for your event. It means a lot.</p>
<p>You're now part of a network of brands, venues, and event teams we've worked with across South Florida. When something new comes up on our end — new hardware, availability windows, or opportunities for collaboration — you'll hear about it first.</p>
<p>Until next time — thanks for a great event.</p>
${SIG}`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. WIN-BACK (1 email — triggers on status → lost)
  // ─────────────────────────────────────────────────────────────
  {
    name: "Win-Back",
    type: "win_back",
    description: "1 warm email sent when a lead is marked as lost. Keeps the door open with no pressure.",
    steps: [
      {
        step_number: 1,
        channel: "email",
        subject: "No pressure — just wanted to leave the door open",
        delay_hours: 0,
        body_html: `<p>Sounds like the timing didn't work out — completely understood. These things have a way of coming back around.</p>
<p>When you're ready to revisit — whether it's for an event, a leasing conversation, or just to see what we've been up to — you know where to find us:</p>
<ul style="line-height:2; list-style:none; padding:0;">
  <li>📞 <a href="tel:7542285654" style="color:#1D1D1F; text-decoration:none;">754.228.5654</a></li>
  <li>🌐 <a href="https://simsforhire.com" style="color:#1D1D1F; text-decoration:none;">simsforhire.com</a></li>
  <li>📸 <a href="https://instagram.com/simsforhire" style="color:#1D1D1F; text-decoration:none;">@simsforhire</a></li>
</ul>
<p>No follow-up from us after this. Hope to connect again someday.</p>
${SIG}`,
      },
    ],
  },
];
