import { createServiceClient } from './supabase'

interface LeadData {
  readonly source: 'rent' | 'lease' | 'popup'
  readonly name?: string
  readonly email: string
  readonly phone?: string
  readonly eventType?: string
  readonly eventDate?: string
  readonly guestCount?: string
  readonly businessName?: string
  readonly businessType?: string
  readonly location?: string
  readonly interest?: string
  readonly message?: string
  readonly smsConsent?: boolean
  readonly sourcePage?: string
  readonly utmSource?: string
  readonly utmMedium?: string
  readonly utmCampaign?: string
  readonly utmTerm?: string
  readonly utmContent?: string
  readonly gclid?: string
  readonly fbclid?: string
  readonly landingPage?: string
}

export async function saveLead(lead: LeadData): Promise<void> {
  const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.warn('[Supabase] Missing env vars — skipping lead save')
    return
  }

  const supabase = createServiceClient()

  const { error } = await supabase.from('leads').insert({
    source: lead.source,
    name: lead.name ?? null,
    email: lead.email,
    phone: lead.phone ?? null,
    event_type: lead.eventType ?? null,
    event_date: lead.eventDate ?? null,
    guest_count: lead.guestCount ?? null,
    business_name: lead.businessName ?? null,
    business_type: lead.businessType ?? null,
    location: lead.location ?? null,
    interest: lead.interest ?? null,
    message: lead.message ?? null,
    sms_consent: lead.smsConsent ?? false,
    source_page: lead.sourcePage ?? null,
    utm_source: lead.utmSource ?? null,
    utm_medium: lead.utmMedium ?? null,
    utm_campaign: lead.utmCampaign ?? null,
    utm_term: lead.utmTerm ?? null,
    utm_content: lead.utmContent ?? null,
    gclid: lead.gclid ?? null,
    fbclid: lead.fbclid ?? null,
    landing_page: lead.landingPage ?? null,
  })

  if (error) {
    console.error('[Supabase] Failed to save lead:', error.message)
    throw error
  }
}
