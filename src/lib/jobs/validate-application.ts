import type { SocialLink } from './types'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_SOCIALS = 10
const MAX_ABOUT_ME_LENGTH = 2000
const MAX_NAME_LENGTH = 100
const MAX_FIELD_LENGTH = 200

interface ApplicationInput {
  readonly jobId: string
  readonly fullName: string
  readonly email: string
  readonly phone: string
  readonly instagram: string
  readonly aboutMe: string
  readonly socials?: readonly { readonly platform: string; readonly handle: string }[]
}

interface ValidationSuccess {
  readonly success: true
  readonly data: {
    readonly jobId: string
    readonly fullName: string
    readonly email: string
    readonly phone: string
    readonly instagram: string
    readonly aboutMe: string
    readonly socials: readonly SocialLink[]
  }
}

interface ValidationFailure {
  readonly success: false
  readonly error: string
}

type ValidationResult = ValidationSuccess | ValidationFailure

function fail(error: string): ValidationFailure {
  return { success: false, error }
}

export function validateApplication(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return fail('Invalid request body')
  }

  const data = input as Record<string, unknown>

  // Required: jobId
  const jobId = typeof data.jobId === 'string' ? data.jobId.trim() : ''
  if (!jobId) return fail('Job ID is required')

  // Required: fullName
  const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : ''
  if (!fullName) return fail('Full name is required')
  if (fullName.length > MAX_NAME_LENGTH) {
    return fail(`Full name must be under ${MAX_NAME_LENGTH} characters`)
  }

  // Required: email
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  if (!email) return fail('Email is required')
  if (!EMAIL_REGEX.test(email)) return fail('Please enter a valid email address')

  // Required: phone
  const phone = typeof data.phone === 'string' ? data.phone.trim() : ''
  if (!phone) return fail('Phone number is required')
  if (phone.length > MAX_FIELD_LENGTH) {
    return fail(`Phone must be under ${MAX_FIELD_LENGTH} characters`)
  }

  // Required: instagram
  const instagram = typeof data.instagram === 'string' ? data.instagram.trim() : ''
  if (!instagram) return fail('Instagram handle is required')
  if (instagram.length > MAX_FIELD_LENGTH) {
    return fail(`Instagram handle must be under ${MAX_FIELD_LENGTH} characters`)
  }

  // Required: aboutMe
  const aboutMe = typeof data.aboutMe === 'string' ? data.aboutMe.trim() : ''
  if (!aboutMe) return fail('About me is required')
  if (aboutMe.length > MAX_ABOUT_ME_LENGTH) {
    return fail(`About me must be under ${MAX_ABOUT_ME_LENGTH} characters`)
  }

  // Optional: socials (max 10)
  const rawSocials = Array.isArray(data.socials) ? data.socials : []
  if (rawSocials.length > MAX_SOCIALS) {
    return fail(`Maximum ${MAX_SOCIALS} social links allowed`)
  }

  const socials: SocialLink[] = []
  for (const item of rawSocials) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const platform = typeof rec.platform === 'string' ? rec.platform.trim() : ''
    const handle = typeof rec.handle === 'string' ? rec.handle.trim() : ''
    if (platform && handle) {
      if (platform.length > MAX_FIELD_LENGTH || handle.length > MAX_FIELD_LENGTH) {
        return fail(`Social link values must be under ${MAX_FIELD_LENGTH} characters`)
      }
      socials.push({ platform, handle })
    }
  }

  return {
    success: true,
    data: { jobId, fullName, email, phone, instagram, aboutMe, socials },
  }
}
