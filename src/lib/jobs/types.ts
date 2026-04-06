export interface JobImage {
  readonly url: string
  readonly filename: string
  readonly is_main: boolean
}

export interface Job {
  readonly id: string
  readonly title: string
  readonly slug: string
  readonly description: string | null
  readonly requirements_input: string | null
  readonly tags: readonly string[]
  readonly images: readonly JobImage[]
  readonly status: 'active' | 'paused'
  readonly created_at: string
  readonly updated_at: string
}

export interface SocialLink {
  readonly platform: string
  readonly handle: string
}

export interface JobApplication {
  readonly id: string
  readonly job_id: string
  readonly full_name: string
  readonly email: string
  readonly phone: string
  readonly instagram: string
  readonly socials: readonly SocialLink[]
  readonly about_me: string
  readonly resume_url: string | null
  readonly images: readonly string[]
  readonly status: 'new' | 'reviewed' | 'contacted' | 'hired' | 'rejected'
  readonly created_at: string
  readonly job_title?: string
}

export type ApplicationStatus = JobApplication['status']

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  'new', 'reviewed', 'contacted', 'hired', 'rejected',
] as const

export interface ApiResponse<T> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
}
