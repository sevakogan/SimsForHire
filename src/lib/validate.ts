export interface ContactFormData {
  readonly name: string
  readonly email: string
  readonly phone?: string
  readonly eventType?: string
  readonly eventDate?: string
  readonly guestCount?: string
  readonly message: string
}

interface ValidationResult {
  readonly success: true
  readonly data: ContactFormData
}

interface ValidationError {
  readonly success: false
  readonly error: string
}

export function validateContactForm(
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

  if (!message) {
    return { success: false, error: 'Message is required' }
  }

  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return { success: false, error: 'Input exceeds maximum length' }
  }

  return {
    success: true,
    data: {
      name,
      email,
      message,
      phone: typeof data.phone === 'string' ? data.phone.trim() : undefined,
      eventType:
        typeof data.eventType === 'string' ? data.eventType.trim() : undefined,
      eventDate:
        typeof data.eventDate === 'string' ? data.eventDate.trim() : undefined,
      guestCount:
        typeof data.guestCount === 'string'
          ? data.guestCount.trim()
          : undefined,
    },
  }
}
