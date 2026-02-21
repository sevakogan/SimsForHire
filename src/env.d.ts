/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SLACK_WEBHOOK_URL: string
  readonly SENDGRID_API_KEY: string
  readonly SENDGRID_FROM_EMAIL: string
  readonly TWILIO_ACCOUNT_SID: string
  readonly TWILIO_AUTH_TOKEN: string
  readonly TWILIO_FROM_NUMBER: string
  readonly TWILIO_TO_NUMBER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
