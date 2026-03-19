export interface Racer {
  readonly id: string
  readonly event_id: string
  readonly name: string
  readonly phone: string
  readonly email: string | null
  readonly lap_time: string | null
  readonly lap_time_ms: number | null
  readonly queue_pos: number | null
  readonly registered_at: string
  readonly completed_at: string | null
  readonly sms_sent: boolean
  readonly sms_status: string | null
  readonly created_at: string
}

export interface LiveEvent {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly theme: string
  readonly status: 'active' | 'archived'
  readonly created_at: string
  readonly updated_at: string
}

export interface EventConfig {
  readonly id: string
  readonly event_id: string
  readonly dealer_name: string
  readonly event_name: string
  readonly sms_enabled: boolean
  readonly admin_pin: string
  readonly track_name: string
  readonly updated_at: string
  readonly logo_left: string
  readonly logo_right: string
  readonly logo_3: string
  readonly logo_4: string
  readonly waiver_text: string
  readonly event_date: string
  readonly event_time: string
  readonly employee_pin: string
}

export type LeadStatus = 'new' | 'contacted' | 'closed'
export type AdminRole = 'admin' | 'employee'
