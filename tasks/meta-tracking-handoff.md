# Meta Pixel + CAPI + Custom Audience — Handoff

Copy-paste-ready spec for installing Meta browser Pixel, server-side
Conversions API, and Custom Audience pushes on any new project.

This is what the **simsforhire-admin** project follows. Anyone adding tracking
to **another** project (the public Astro landing page, the live race-board
app, etc.) can mirror this exactly.

---

## Why all three layers

| Layer | Purpose | When it fires |
|---|---|---|
| **Browser Pixel** (`fbq`) | Drop a third-party cookie + send hashed PII directly from the user's browser → Meta. Fast, cheap. | Immediately on form submit success. |
| **Conversions API** (CAPI) | Same event re-sent server-side with hashed PII. Survives iOS 14.5+ tracking blocks, ad-blockers, missing cookies. | Inside the server action that recorded the conversion. |
| **Custom Audiences API** | Async batch push of hashed PII to a named audience for retargeting + lookalike seeding. | Triggered by Supabase webhook → n8n workflow on every new row. |

**All three fire for the same conversion**, with the **same `event_id`** so Meta dedupes Pixel + CAPI into one event and doesn't inflate counts.

---

## 0. Environment variables

```bash
# Same values as simsforhire-admin (Resend account holder is hi@simsforhire.com)
META_PIXEL_ID=<digits-only, e.g. 1234567890123456>
META_CAPI_ACCESS_TOKEN=<system-user token from Events Manager → Settings>

# Public-facing variant for the browser Pixel
# (Next.js needs the prefix to expose it client-side)
NEXT_PUBLIC_META_PIXEL_ID=<same digits as META_PIXEL_ID>

# Optional: custom audience id once it exists in Business Manager
META_CUSTOM_AUDIENCE_ID=<digits-only>
```

Add to Vercel for production:

```bash
echo -n "1234567890123456" | vercel env add NEXT_PUBLIC_META_PIXEL_ID production
echo -n "<token>"           | vercel env add META_CAPI_ACCESS_TOKEN     production
```

---

## 1. Drop in the CAPI helper (server-side, no extra deps)

Copy `src/lib/meta-capi.ts` from this repo into the other project, verbatim.

It already does:
- SHA-256 hashing of email / phone / first name / last name
- Phone normalisation (`+1` for US 10-digit numbers)
- Optional `event_id` for browser ↔ server dedup
- Auto-skips if env vars aren't set (safe in dev/preview)

Then call it from the server-side handler that recorded the conversion. Inside
your form-submit server action / API route, AFTER the DB insert succeeds:

```ts
import { sendCAPIEvent } from "@/lib/meta-capi";
import { headers } from "next/headers";
import crypto from "crypto";

const eventId = crypto.randomUUID();           // unique per submission
const hdrs = await headers();
const sourceUrl = `https://${hdrs.get("host")}${hdrs.get("x-original-url") ?? "/"}`;

const [firstName, ...rest] = name.trim().split(/\s+/);
const lastName = rest.join(" ");

await sendCAPIEvent({
  eventName: "Lead",                            // or "CompleteRegistration", etc.
  eventSourceUrl: sourceUrl,
  eventId,                                      // critical for dedup
  userData: { email, phone, firstName, lastName },
  customData: { event_slug: eventSlug, waiver_version: waiverVersion },
});

return { ok: true, eventId };                   // hand event_id back to the client
```

---

## 2. Browser Pixel — load + fire

### a. Loader component (mount once on each page that fires Pixel events)

Create `src/components/meta/MetaPixelLoader.tsx`:

```tsx
"use client";

import Script from "next/script";

const PIXEL_BASE_SCRIPT = (pixelId: string) => `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
`;

export function MetaPixelLoader({ pixelId }: { pixelId: string }) {
  if (!pixelId) return null;
  return (
    <>
      <Script
        id="meta-pixel-base"
        strategy="afterInteractive"
        // The Pixel base snippet is the official Meta-published payload.
        // It is a constant string interpolated only with the trusted pixelId
        // env var, so dangerouslySetInnerHTML is safe here.
        dangerouslySetInnerHTML={{ __html: PIXEL_BASE_SCRIPT(pixelId) }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          height="1"
          width="1"
          style={{ display: "none" }}
          src={\`https://www.facebook.com/tr?id=\${pixelId}&ev=PageView&noscript=1\`}
        />
      </noscript>
    </>
  );
}
```

### b. Mount it on the public conversion page

```tsx
// e.g. src/app/waiver/[slug]/page.tsx
import { MetaPixelLoader } from "@/components/meta/MetaPixelLoader";

export default async function PublicWaiverPage(/* ... */) {
  return (
    <main>
      <MetaPixelLoader pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ""} />
      {/* rest of the page */}
    </main>
  );
}
```

### c. Type augmentation (lets TypeScript know about `window.fbq`)

Create `src/types/global.d.ts`:

```ts
declare global {
  interface Window {
    fbq?: (
      action: "track" | "init" | "trackCustom",
      eventName: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void;
  }
}
export {};
```

### d. Fire `Lead` on form-submit success (browser side)

Inside the client form component, after the server action returns ok:

```tsx
const result = await recordWaiverSignature({/* ... */});
if (result.ok) {
  // Same event_id as the CAPI call — Meta dedupes the pair
  if (typeof window !== "undefined" && window.fbq) {
    const [firstName, ...rest] = name.trim().split(/\s+/);
    const lastName = rest.join(" ");
    window.fbq(
      "track",
      "Lead",
      {
        em: email.trim().toLowerCase(),         // Meta hashes browser-side
        ph: phone.replace(/\D/g, ""),
        fn: firstName.toLowerCase(),
        ln: lastName.toLowerCase(),
        // Optional content metadata for ad rules:
        content_name: "F1 Fan Fest Waiver",
        content_category: "waiver",
      },
      { eventID: result.eventId }               // ← returned from server, dedup key
    );
  }
  setSuccess(/* ... */);
}
```

**Why dedup matters**: without `eventID`, every conversion gets counted twice
in Events Manager — Pixel + CAPI both as separate events. Your CPA reports
inflate, your bid algorithm gets confused, your Lookalike Audience seeds get
noisy. The `eventID` is the *only* knob that fixes this.

---

## 3. Custom Audience push — n8n workflow

The Custom Audiences API is **rate-limited and batch-friendly**, so push it
from n8n on a Supabase webhook (not from the conversion path). This keeps the
user's submit fast (<300ms) and Meta's API stays happy with batched updates.

### a. Create the Custom Audience once via API (one-time)

```bash
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences" \
  -d "name=F1 Fan Fest Waiver Signers" \
  -d "subtype=CUSTOM" \
  -d "description=Signers from /waiver/f1-fanfest" \
  -d "customer_file_source=USER_PROVIDED_ONLY" \
  -d "access_token=<META_CAPI_ACCESS_TOKEN>"
# Response: { "id": "1234567890" }  → store as META_CUSTOM_AUDIENCE_ID
```

### b. n8n workflow — "Push to Meta + Google Customer Match"

**Trigger**: Supabase webhook on INSERT to `racers` where `waiver_version IS NOT NULL`.

**Nodes** (in order):

1. **Webhook** — POST `/waiver-signed`. n8n stamps `webhookId`. Body has `record.email`, `record.phone`, `record.name`.

2. **Code** (JS) — hash + normalise PII:
   ```js
   const crypto = require('crypto');
   const sha = (s) => crypto.createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex');
   const phone = (p) => {
     const d = String(p ?? '').replace(/\D/g, '');
     return d.length === 10 ? '1' + d : d;
   };
   const [fn, ...rest] = String($json.record.name ?? '').trim().split(/\s+/);
   return [{
     em: sha($json.record.email),
     ph: $json.record.phone ? sha(phone($json.record.phone)) : '',
     fn: sha(fn),
     ln: sha(rest.join(' ')),
   }];
   ```

3. **HTTP Request — Meta Custom Audience add**:
   - Method: `POST`
   - URL: `https://graph.facebook.com/v25.0/{{$env.META_CUSTOM_AUDIENCE_ID}}/users`
   - Query: `access_token={{$env.META_CAPI_ACCESS_TOKEN}}`
   - JSON body:
     ```json
     {
       "schema": ["EMAIL", "PHONE", "FN", "LN"],
       "data": [
         ["{{ $json.em }}", "{{ $json.ph }}", "{{ $json.fn }}", "{{ $json.ln }}"]
       ]
     }
     ```

4. **HTTP Request — Google Ads Customer Match** (parallel branch):
   - Auth: OAuth2 with `https://www.googleapis.com/auth/adwords` scope
   - Method: `POST`
   - URL: `https://googleads.googleapis.com/v18/customers/<CUSTOMER_ID>/offlineUserDataJobs:addOperations`
   - Headers: `developer-token: <GADS_DEVELOPER_TOKEN>`
   - Body: see Google's [Customer Match docs](https://developers.google.com/google-ads/api/docs/remarketing/audience-types/customer-match) — same hashed fields, different schema names (`hashedEmail`, `hashedPhoneNumber`).

5. **(Optional) HTTP Request — Google Enhanced Conversions**: only if you have an existing Google Ads conversion action mapped to this lead. Use the `conversions:upload` endpoint with `userIdentifiers`.

### c. Lookalike audience (build in Ads Manager UI, one-time)

1. **Audiences → Create Audience → Lookalike**
2. Source: `F1 Fan Fest Waiver Signers`
3. Location: Miami, FL +50mi (or whatever metro you target)
4. Size: **1%** — tightest match for a small seed audience
5. After ~500 seed signers, also create a **2–3% lookalike** for scale

---

## 4. Verify the pipeline (5-min sanity check)

1. **Browser Pixel** — open https://your-site.com/waiver/<slug> in Chrome with the [Meta Pixel Helper extension](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc). It should show **PageView fired** on load and **Lead fired** on submit.
2. **CAPI** — Events Manager → Test Events tab → enter your `event_id` from the form submit (or the test code). The event should appear within 30s.
3. **Dedup** — Events Manager → Diagnostics. Look for "deduplication for browser and server events". Should be ✅, not ⚠️.
4. **Custom Audience** — Audiences → click your audience → Activity should show "Updated" within ~30 min after a new signer.

---

## 5. Common gotchas

| Symptom | Likely cause | Fix |
|---|---|---|
| Events double-counted | No `event_id` shared between Pixel + CAPI | Pass `eventID` (browser) and `event_id` (CAPI) — same UUID. |
| `Lead` events show but no `em`/`ph` in Events Manager | Browser Pixel sent unhashed PII, ad-blocker stripped it. | Always send unhashed text from browser; Meta hashes server-side. CAPI receives hashed (we hash it ourselves). |
| Custom Audience size shows 0 after 24h | Hashing mismatch — un-trimmed or mixed-case. | All PII must be `trim().toLowerCase()` *before* SHA-256. Phones must be E.164-without-`+` (e.g. `13055551234`). |
| `(#100) Param value must be valid` from Meta API | Wrong access token (probably User vs System User token). | Generate a System User token from Business Settings → Users → System Users → Generate New Token, with `ads_management` + `business_management` scopes. |

---

## 6. File checklist for the other project

To replicate end-to-end:

- [ ] Copy `src/lib/meta-capi.ts`
- [ ] Add `src/components/meta/MetaPixelLoader.tsx`
- [ ] Add `src/types/global.d.ts` for `window.fbq`
- [ ] Set 4 env vars (`META_PIXEL_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, optionally `META_CUSTOM_AUDIENCE_ID`)
- [ ] Fire `sendCAPIEvent` from the server action that records the conversion — capture and return `eventId`
- [ ] Mount `<MetaPixelLoader>` on the conversion page
- [ ] Fire `window.fbq("track", "Lead", {...}, { eventID })` on form-success
- [ ] Build n8n workflow with Supabase webhook → hash → push to Meta + Google Ads

Last updated: handoff written 2026-04-28.
