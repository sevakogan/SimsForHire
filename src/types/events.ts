export type EventType = "race" | "waiver";

export interface LiveEvent {
  id: string;
  slug: string;
  name: string;
  theme: string | null;
  status: "active" | "archived";
  event_type: EventType;
  created_at: string;
  updated_at: string;
}

export interface EventWaiverVersion {
  id: string;
  event_id: string;
  version: number;
  body: string;
  created_at: string;
}

export interface EventConfig {
  id: string;
  event_id: string;
  dealer_name: string | null;
  event_name: string | null;
  track_name: string | null;
  event_date: string | null;
  event_time: string | null;
  admin_pin: string;
  employee_pin: string | null;
  sms_enabled: boolean;
  logo_left: string | null;
  logo_right: string | null;
  logo_3: string | null;
  logo_4: string | null;
  waiver_text: string | null;
  updated_at: string;
}

export interface Racer {
  id: string;
  event_id: string;
  name: string;
  phone: string;
  email: string | null;
  queue_pos: number | null;
  lap_time: string | null;
  lap_time_ms: number | null;
  registered_at: string;
  completed_at: string | null;
  sms_sent: boolean;
  sms_status: string | null;
  created_at: string;
  // Waiver audit (populated only when this row was created via a waiver signature)
  waiver_version: number | null;
  waiver_accepted_at: string | null;
  waiver_accepted_ip: string | null;
  waiver_accepted_user_agent: string | null;
}

export type EventRole = "admin" | "employee";

export interface EventWithConfig extends LiveEvent {
  config: EventConfig | null;
}

export interface EventStats {
  totalRacers: number;
  inQueue: number;
  completed: number;
}
