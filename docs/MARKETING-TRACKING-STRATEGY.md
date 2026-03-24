# Universal Marketing & Tracking Infrastructure — Karbon Agency
## Last Updated: 2026-03-24
## Applies to: SimsForHire, My Little Genius Academy, and all future client sites

---

## TRACKING PIXELS & TAGS INSTALLED

### 1. Google Tag Manager (GTM)
- **ID:** GTM-TXWT5JDH
- **Status:** LIVE
- **Location:** BaseLayout.astro (head + noscript fallback in body)
- **Purpose:** Container for all Google tags, custom events, and third-party integrations

### 2. GA4 (Google Analytics 4) — Direct
- **ID:** G-S7R6C7KLK1
- **Status:** LIVE
- **Location:** BaseLayout.astro (fires independently of GTM)
- **Purpose:** Backup analytics — fires even if GTM is blocked by ad blockers. Ensures we never lose pageview data.

### 3. Google Ads Global Site Tag
- **Env Var:** GOOGLE_ADS_ID
- **Status:** LIVE (conditional — only fires if GOOGLE_ADS_ID is set)
- **Location:** BaseLayout.astro
- **Purpose:** Google Ads conversion tracking + remarketing audiences. Required for Smart Bidding and ROAS optimization.

### 4. Meta Pixel (Facebook/Instagram)
- **Pixel ID:** Loaded from META_PIXEL_ID env var
- **Status:** LIVE
- **Location:** BaseLayout.astro
- **Events tracked:**
  - `PageView` (every page)
  - `Lead` (on form submissions — rent, lease, popup)
  - `StoreClick` (custom event when users click store link)
  - `PopupView` (custom event when timed popup appears)
- **Deduplication:** Event IDs generated client-side, matched with server-side CAPI

### 5. Meta Conversions API (CAPI) — Server-Side
- **Pixel ID:** 1165380555705221
- **Status:** LIVE
- **Location:** src/lib/meta-capi.ts
- **Purpose:** Server-side event tracking that bypasses ad blockers. PII is SHA256 hashed before sending.
- **Events:** Lead events from all 3 forms (rent, lease, popup)
- **Data sent:** email, phone, first/last name, IP, user agent, fbc, fbp cookies
- **Deduplication:** Uses same eventId as client-side pixel

### 6. Microsoft Clarity
- **Project ID:** qx14m3k8qr
- **Status:** LIVE
- **Location:** BaseLayout.astro
- **Purpose:** FREE heatmaps, session recordings, scroll depth, rage clicks, dead clicks. Shows exactly how users interact with every page. Invaluable for conversion rate optimization.

### 7. TikTok Pixel
- **Status:** READY (commented out, needs pixel ID)
- **Location:** BaseLayout.astro
- **Action needed:** Create TikTok Ads account → get pixel ID → replace YOUR_TIKTOK_PIXEL_ID → uncomment

### 8. LinkedIn Insight Tag
- **Status:** READY (commented out, needs partner ID)
- **Location:** BaseLayout.astro
- **Action needed:** LinkedIn Campaign Manager → get partner ID → replace YOUR_LINKEDIN_PARTNER_ID → uncomment
- **Best for:** B2B lease leads (dealerships, corporate venues)

### 9. Pinterest Tag
- **Status:** READY (commented out, needs tag ID)
- **Location:** BaseLayout.astro
- **Action needed:** Pinterest Ads → get tag ID → replace YOUR_PINTEREST_TAG_ID → uncomment

### 10. X (Twitter) Pixel
- **Status:** READY (commented out, needs pixel ID)
- **Location:** BaseLayout.astro
- **Action needed:** X Ads → get pixel ID → replace YOUR_TWITTER_PIXEL_ID → uncomment

---

## UTM TRACKING & ATTRIBUTION SYSTEM

### How It Works
1. **Capture (BaseLayout.astro):** On every page load, a script checks URL params for `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `fbclid`
2. **Persist (sessionStorage):** Stored as `s4h_utm` JSON + `s4h_landing` (first page URL)
3. **Forward (all forms):** Every form submission (rent, lease, popup) reads sessionStorage and includes UTM data in the API payload
4. **Store (Supabase):** API routes extract UTM fields and pass them to `saveLead()` which writes to the `leads` table

### Forms with UTM forwarding:
- **Contact.astro** (rent form) — UTM forwarding active
- **TimedPopup.astro** (popup form) — UTM forwarding active
- **lease.astro** (lease form) — UTM forwarding active

### API routes updated:
- `api/contact.ts` — extracts & stores UTM
- `api/lease.ts` — extracts & stores UTM
- `api/popup.ts` — extracts & stores UTM

### Database columns (Supabase `leads` table):
- `utm_source` — e.g., google, facebook, instagram, tiktok
- `utm_medium` — e.g., cpc, social, email, organic
- `utm_campaign` — campaign name
- `utm_term` — paid search keyword
- `utm_content` — ad variation
- `gclid` — Google Click ID (auto-captured from Google Ads)
- `fbclid` — Facebook Click ID (auto-captured from Meta ads)
- `landing_page` — first URL the visitor landed on

**Migration SQL:** `docs/migrations/004-utm-tracking-columns.sql` (must be run in Supabase SQL Editor)

---

## COOKIE CONSENT (GDPR/CCPA)

- **Status:** LIVE
- **Location:** BaseLayout.astro (bottom banner)
- **Behavior:**
  - Shows banner on first visit
  - "Accept" → stores `s4h_consent=accepted` in localStorage, banner hides
  - "Reject" → stores `s4h_consent=rejected`, disables GA4 (`ga-disable-G-S7R6C7KLK1`), clears Meta cookies (`_fbp`, `_fbc`)
  - Does not show again after choice (persistent via localStorage)

---

## GTM DATAAYER EVENTS

These custom events fire via `window.dataLayer.push()` and can be used in GTM for triggers:

| Event Name | Trigger | Location |
|---|---|---|
| `store_click` | User clicks any store link | BaseLayout.astro |
| `popup_view` | Timed popup appears (60s) | TimedPopup.astro |
| `popup_lead` | Popup form submitted | TimedPopup.astro |
| `lease_lead` | Lease form submitted | lease.astro |
| `rent_lead_thankyou` | Rent thank-you page loads | thank-you/rent.astro |
| `lease_lead_thankyou` | Lease thank-you page loads | thank-you/lease.astro |
| `popup_lead_thankyou` | Popup thank-you page loads | thank-you/inquiry.astro |

---

## BUGS FIXED

1. **contact.ts labels array** — Was `['slack', 'email', 'lead-email', 'meta-capi']` for 5 promises. Fixed to `['slack', 'email', 'lead-email', 'save-lead', 'meta-capi']`
2. **lease.ts labels array** — Was `['slack', 'meta-capi']` for 5 promises. Fixed to `['slack', 'lease-email', 'lease-notification-email', 'save-lead', 'meta-capi']`

---

## WHAT THIS ENABLES

### For Google Ads:
- Track which keywords/campaigns generate leads (via gclid + utm_term)
- Build remarketing audiences from site visitors
- Optimize bidding with conversion data

### For Meta/Instagram Ads:
- Server-side conversion tracking (bypasses iOS 14+ privacy restrictions)
- Build lookalike audiences from lead data
- Attribute leads to specific ads/campaigns (via fbclid)
- Cross-platform deduplication (pixel + CAPI)

### For Analytics:
- See full user journey: landing page → pages viewed → form submitted
- Heatmaps & session recordings (Clarity) for CRO
- Know exactly which channel/campaign/ad/keyword drives each lead

### For Retargeting:
- Google Ads remarketing (all site visitors)
- Meta Custom Audiences (all site visitors + lead events)
- Ready to activate: TikTok, LinkedIn, Pinterest, X retargeting (just add pixel IDs)

---

## ADVANCED TRACKING — LEARNED FROM MLGA DANVILLE PROJECT (March 2026)

These techniques were developed during the My Little Genius Academy build and should be applied to ALL future client sites from day one.

### 11. Scroll Depth Tracking
- **Status:** STANDARD (add to all client sites)
- **Events:** Fire at 25%, 50%, 75%, 100% scroll
- **Purpose:** Know where visitors drop off, build custom audiences of engaged users
- **Fires:** Meta custom event `ScrollDepth` + GA4 `scroll_depth` + CAPI server-side
- **Apply to:** High-content pages (landing pages, programs, services, about)

### 12. Time on Page Tracking
- **Status:** STANDARD (add to all client sites)
- **Events:** Fire at 30s, 60s, 120s
- **Purpose:** Identify high-intent visitors. 60s+ = qualified. Build audiences for retargeting.
- **Fires:** Meta custom event `TimeOnPage` + GA4 `time_on_page` + CAPI server-side
- **Apply to:** All pages

### 13. Form Abandonment Detection
- **Status:** STANDARD (add to all sites with forms)
- **Events:** `FormStart` on first field focus, `FormAbandonment` on beforeunload if not submitted
- **Purpose:** Retarget people who started but didn't finish. "Still thinking about it?" ads.
- **Fires:** Meta custom event + GA4 event + CAPI server-side

### 14. Phone & Email Click Tracking
- **Status:** STANDARD (add to all client sites)
- **Events:** Track clicks on `tel:` and `mailto:` links
- **Purpose:** Phone calls = highest intent leads. Must be tracked as conversions, not just page views.
- **Fires:** Meta `Contact` event with value + GA4 `conversion` + CAPI server-side

### 15. Registration/Funnel Step Tracking
- **Status:** ADD WHEN MULTI-STEP FUNNELS EXIST
- **Events:** Track each step (Handbook Request → Schedule Visit → Download Forms → Submit)
- **Purpose:** Know exactly where the funnel leaks. Retarget at each drop-off point.
- **Fires:** Meta events (InitiateCheckout, AddToCart) + GA4 custom events

### 16. Outbound Link Tracking
- **Status:** STANDARD (add to all sites with external links)
- **Events:** Track clicks to external sites (Google Maps, Shopify, social media, etc.)
- **Purpose:** Maps click = high intent to visit physically. Track it.
- **Fires:** Meta custom event `OutboundClick` + GA4 `outbound_click`

### 17. UTM Capture & Cookie Storage
- **Status:** STANDARD (add to ALL client sites on day one)
- **Captures:** utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, gclid
- **Storage:** Cookie `[client]_utm` with 30-day expiry
- **Injection:** Auto-inject into all forms as hidden fields
- **Purpose:** Full ad attribution — know exactly which ad → which lead

---

## EVENT VALUE FRAMEWORK

**CRITICAL: Always assign dollar values to conversion events.** Meta and Google optimize for VALUE, not just volume. Without values, you get cheap low-quality clicks.

### How to Calculate Event Values:
1. Get the **average customer lifetime value (LTV)** from the client
2. Estimate **conversion rate** at each funnel stage
3. Work backwards from LTV to assign proportional values

### Example — My Little Genius Academy (LTV = $2,000/enrollment):

| Event | Value | Rationale |
|---|---|---|
| PageView | $0 | Standard, no value |
| ViewContent | $20 | 1% chance of enrolling |
| RegistrationPageView | $50 | 2.5% intent |
| Contact (page visit) | $75 | 3.75% intent |
| Email Click | $100 | 5% intent |
| Handbook Request | $100 | 5% intent |
| Phone Click | $150 | 7.5% — phone calls are high intent |
| Lead (form submit) | $200 | 10% conversion rate |
| Registration Forms Download | $300 | 15% — actively enrolling |
| Tour Booked | $400 | 20% conversion rate |
| CompleteRegistration | $500 | 25% conversion rate |

### Example — SimsForHire (Average booking = $2,500):

| Event | Value | Rationale |
|---|---|---|
| PageView | $0 | Standard |
| ViewContent | $25 | Browsing |
| StoreClick | $50 | Engagement |
| PopupView | $30 | Passive interest |
| Phone Click | $125 | High intent |
| Lead (form submit) | $250 | 10% close rate |
| PopupLead | $200 | Slightly lower intent than direct form |

**Rule: Every client project MUST have an event value map before ads go live.**

---

## SERVER-SIDE CAPI — MANDATORY FOR ALL CLIENTS

### Why It's Mandatory:
- iOS 14+ privacy blocks ~30-40% of browser pixel events
- Ad blockers strip Meta/Google pixels on ~15% of traffic
- CAPI sends events server-side, bypassing all browser restrictions
- Browser Pixel + CAPI = near 100% conversion tracking
- **Without CAPI, you're flying blind on 30-40% of your conversions**

### Implementation Pattern:
```javascript
function sendCAPI(eventName, eventData, userData) {
  var payload = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: genEventId(), // For deduplication with browser pixel
      event_source_url: window.location.href,
      action_source: 'website',
      user_data: {
        client_user_agent: navigator.userAgent,
        fbc: getFbc(), // Facebook click cookie
        fbp: getFbp(), // Facebook browser cookie
        // Add hashed PII when available (email, phone, name)
      },
      custom_data: eventData
    }]
  };
  navigator.sendBeacon(
    'https://graph.facebook.com/v18.0/' + PIXEL_ID + '/events?access_token=' + CAPI_TOKEN,
    JSON.stringify(payload)
  );
}
```

### Deduplication:
- Generate a unique `event_id` for each event
- Send the SAME event_id from both browser pixel and CAPI
- Meta deduplicates automatically — no double counting

---

## CROSS-DOMAIN TRACKING — MANDATORY WHEN MULTIPLE DOMAINS

### When It Applies:
- Landing page on Vercel + main site on WordPress
- Subdomain (tour.site.com) + main domain (site.com)
- Shopify store + main site
- Any time a user crosses domain boundaries in the funnel

### Setup Checklist:
1. ✅ Same Meta Pixel ID on both domains (auto-handles cross-domain)
2. ✅ GA4 cross-domain linking enabled in GA4 Admin → Data Streams → Configure tag settings → Configure your domains
3. ✅ Add both domains to the referral exclusion list in GA4
4. ✅ Test the full user journey: Ad → Landing Page → Main Site → Conversion

**LESSON LEARNED:** Always set up cross-domain tracking THE MOMENT you deploy to a second domain. Don't wait for the user to ask. This was missed on the MLGA project initially.

---

## A/B TESTING FRAMEWORK FOR LANDING PAGES

### Standard A/B Test Setup:
1. **Variant A:** Control (e.g., "Schedule a Free Tour")
2. **Variant B:** Challenger (e.g., "Limited Spots — Reserve Now")
3. Same ad creative → different destination URLs
4. Track via UTM: `utm_content=lp_variant_a` vs `utm_content=lp_variant_b`

### UTM Naming Convention (Use for ALL Clients):
```
utm_source=meta|google|instagram|tiktok
utm_medium=paid|organic|email|referral
utm_campaign=[client]_[campaign_name]
utm_content=[test_variable]_[variant]
utm_term=[keyword] (Google Ads only)
```

### What to A/B Test (Priority Order):
1. **Landing page** (biggest impact) — different headlines, CTAs
2. **Ad creative** — photo vs video, facility vs people
3. **Ad copy** — free offer vs urgency vs social proof
4. **Audience** — interest vs lookalike vs retargeting vs broad

---

## COOKIE CONSENT (GDPR/CCPA)

- **Status:** LIVE (SimsForHire), NEEDED (MLGA)
- **Behavior:**
  - Shows banner on first visit
  - "Accept" → stores consent, enables all tracking
  - "Reject" → disables GA4, clears Meta cookies
  - Does not show again after choice

---

## MICROSOFT CLARITY — ADD TO ALL CLIENT SITES

- **What:** FREE heatmaps, session recordings, scroll depth, rage clicks, dead clicks
- **Cost:** $0
- **Value:** See exactly how users interact with every page. Invaluable for CRO.
- **Setup:** One script tag in the header. No configuration needed.
- **Review:** Weekly check for UX friction points
- **SimsForHire ID:** qx14m3k8qr
- **MLGA:** Not yet added (TODO)

---

## CLIENT TRACKING REGISTRY

### SimsForHire
| Tracking | ID/Status |
|---|---|
| GTM | GTM-TXWT5JDH ✅ |
| GA4 | G-S7R6C7KLK1 ✅ |
| Meta Pixel | Env var ✅ |
| Meta CAPI | 1165380555705221 ✅ |
| Microsoft Clarity | qx14m3k8qr ✅ |
| Google Ads | Conditional ✅ |
| TikTok | Ready (needs ID) |
| LinkedIn | Ready (needs ID) |
| Pinterest | Ready (needs ID) |
| X/Twitter | Ready (needs ID) |
| Cookie Consent | ✅ |
| UTM Capture | ✅ (sessionStorage → Supabase) |
| Event Values | TODO — needs value map |
| Scroll Depth | TODO |
| Time on Page | TODO |
| Form Abandonment | TODO |

### My Little Genius Academy — Danville
| Tracking | ID/Status |
|---|---|
| GA4 | G-DL2BDMFKCK ✅ (MonsterInsights) |
| Meta Pixel | 1276708521062654 ✅ |
| Meta CAPI | Server-side via header script ✅ |
| Scroll Depth | ✅ |
| Time on Page | ✅ |
| Form Abandonment | ✅ (Gravity Forms) |
| Phone/Email Click | ✅ |
| Funnel Step Tracking | ✅ (Registration page) |
| Outbound Link Tracking | ✅ |
| UTM Capture | ✅ (cookie → form injection) |
| Event Values | ✅ (based on $2,000 LTV) |
| Cross-Domain | Pending (tour subdomain → main site) |
| Microsoft Clarity | TODO |
| Cookie Consent | TODO |
| Google Ads Remarketing | TODO (when client runs Google Ads) |
| GTM | Not needed (WPCode handles it) |

---

## NEW CLIENT ONBOARDING CHECKLIST

When setting up ANY new client site for ads, do ALL of these on day one:

- [ ] Install Meta Pixel (sitewide)
- [ ] Install Meta CAPI (server-side, same pixel ID)
- [ ] Set up event deduplication (matching event IDs)
- [ ] Install GA4 (or verify existing)
- [ ] Add scroll depth tracking
- [ ] Add time on page tracking
- [ ] Add form abandonment detection
- [ ] Add phone/email click tracking
- [ ] Add UTM capture & cookie storage
- [ ] Add UTM injection into all forms
- [ ] Create event value map (requires client LTV)
- [ ] Set up cross-domain tracking (if multiple domains)
- [ ] Install Microsoft Clarity (free heatmaps)
- [ ] Add cookie consent banner
- [ ] Create A/B landing page variants
- [ ] Generate UTM tracking links for all ad campaigns
- [ ] Document everything in this file under Client Tracking Registry

---

## NEXT STEPS / RECOMMENDATIONS

### SimsForHire:
1. **Run Supabase migration** — `docs/migrations/004-utm-tracking-columns.sql`
2. **Add scroll depth + time on page tracking** (missing from current build)
3. **Add form abandonment tracking** to all 3 forms
4. **Create event value map** based on average booking value
5. **Add Microsoft Clarity** if not already tracking
6. **Create Meta Custom Conversions** for lead events if not already done
7. **Activate TikTok pixel** if running TikTok ads
8. **Activate LinkedIn Insight** if targeting B2B lease leads
9. **Review Clarity recordings** weekly to find UX friction points
10. **Build a Supabase dashboard** or Looker Studio report to visualize lead attribution

### My Little Genius Academy:
1. **Get Namecheap DNS access** — verify Resend domain + point tour subdomain
2. **Connect Google Calendar API** — service account for tour booking
3. **Set up Resend emails** — booking confirmations + admin notifications
4. **Add Microsoft Clarity** — free heatmaps on WordPress
5. **Add cookie consent banner** — CCPA compliance
6. **Enable GA4 cross-domain linking** — tour subdomain + main site
7. **Review & approve landing page design** with client
8. **Launch Meta ads** with A/B test (Variant A vs B)
