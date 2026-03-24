/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Supabase (server-side)
  readonly NEXT_PUBLIC_SUPABASE_URL: string
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  readonly SUPABASE_SERVICE_ROLE_KEY: string

  // Supabase (client-side — Astro PUBLIC_ prefix)
  readonly PUBLIC_SUPABASE_URL: string
  readonly PUBLIC_SUPABASE_ANON_KEY: string

  // Email (Resend — marketing site)
  readonly RESEND_API_KEY: string
  readonly RESEND_FROM_EMAIL: string
  readonly RESEND_LEADS_EMAIL: string

  // Email (SendGrid — S4M leaderboard)
  readonly SENDGRID_API_KEY: string
  readonly SENDGRID_FROM_EMAIL: string

  // SMS (Twilio)
  readonly TWILIO_ACCOUNT_SID: string
  readonly TWILIO_AUTH_TOKEN: string
  readonly TWILIO_FROM_NUMBER: string
  readonly TWILIO_TO_NUMBER: string
  readonly TWILIO_PHONE_NUMBER: string

  // Meta / Facebook
  readonly META_PIXEL_ID: string
  readonly META_CAPI_ACCESS_TOKEN: string

  // Google Ads
  readonly GOOGLE_ADS_ID: string

  // Optional pixel IDs (uncomment in BaseLayout when ready)
  readonly CLARITY_PROJECT_ID?: string
  readonly TIKTOK_PIXEL_ID?: string
  readonly LINKEDIN_PARTNER_ID?: string
  readonly PINTEREST_TAG_ID?: string
  readonly TWITTER_PIXEL_ID?: string

  // Slack
  readonly SLACK_WEBHOOK_URL: string

  // AI (OCR for lap times)
  readonly ANTHROPIC_API_KEY: string

  // Admin
  readonly ADMIN_PIN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
