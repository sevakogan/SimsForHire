export interface LeaseFormData {
  readonly name: string
  readonly email: string
  readonly phone?: string
  readonly businessName?: string
  readonly businessType?: string
  readonly location?: string
  readonly message: string
  readonly smsConsent: boolean
}

interface ValidationResult {
  readonly success: true
  readonly data: LeaseFormData
}

interface ValidationError {
  readonly success: false
  readonly error: string
}

export function validateLeaseForm(
  body: unknown,
): ValidationResult | ValidationError {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' }
  }

  const data = body as Record<string, unknown>

  const name = typeof data.name === 'string' ? data.name.trim() : ''
  const email = typeof data.email === 'string' ? data.email.trim() : ''
  const message = typeof data.message === 'string' ? data.message.trim() : ''

  if (!name) {
    return { success: false, error: 'Name is required' }
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Valid email is required' }
  }

  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return { success: false, error: 'Input exceeds maximum length' }
  }

  return {
    success: true,
    data: {
      name,
      email,
      message: message || 'Lease inquiry from website',
      phone: typeof data.phone === 'string' ? data.phone.trim() : undefined,
      businessName: typeof data.businessName === 'string' ? data.businessName.trim() : undefined,
      businessType: typeof data.businessType === 'string' ? data.businessType.trim() : undefined,
      location: typeof data.location === 'string' ? data.location.trim() : undefined,
      smsConsent: data.smsConsent === true || data.smsConsent === 'on',
    },
  }
}
