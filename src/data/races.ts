export interface LapEntry {
  readonly position: number
  readonly driver: string
  readonly bestLap: string
  readonly gapToLeader: string
  readonly simulator: string
}

export interface RaceSession {
  readonly name: string
  readonly track: string
  readonly game: string
  readonly car: string
  readonly laps: number
  readonly leaderboard: readonly LapEntry[]
}

export interface RaceEvent {
  readonly slug: string
  readonly name: string
  readonly date: string
  readonly venue: string
  readonly type: string
  readonly description: string
  readonly heroImage?: string
  readonly sessions: readonly RaceSession[]
  readonly stats?: {
    readonly totalDrivers: string
    readonly totalLaps: string
    readonly fastestLap: string
    readonly fastestDriver: string
  }
}

export const RACE_EVENTS: readonly RaceEvent[] = [
  {
    slug: 'art-basel-2025',
    name: 'Art Basel Miami',
    date: 'December 2025',
    venue: 'OFFSPEC Miami × Vossen',
    type: 'Brand Activation',
    description:
      'Two days of nonstop racing action at Miami\'s premier Art Basel car show alongside OFFSPEC Miami and Vossen Wheels.',
    sessions: [],
    stats: {
      totalDrivers: '—',
      totalLaps: '—',
      fastestLap: '—',
      fastestDriver: '—',
    },
  },
  {
    slug: 'wynwood-2026',
    name: 'Wynwood Marketplace',
    date: 'January 2026',
    venue: 'Wynwood Marketplace',
    type: 'Private Party',
    description:
      'An exclusive private event at Wynwood Marketplace with 850 guests battling it out on the leaderboard.',
    sessions: [],
    stats: {
      totalDrivers: '—',
      totalLaps: '—',
      fastestLap: '—',
      fastestDriver: '—',
    },
  },
  {
    slug: 'rmc-2026',
    name: 'RMC Miami',
    date: 'February 2026',
    venue: 'RMC Miami',
    type: 'Car Culture',
    description:
      'Miami\'s biggest car culture gathering — three days of sim racing alongside the finest exotics and custom builds.',
    sessions: [],
    stats: {
      totalDrivers: '—',
      totalLaps: '—',
      fastestLap: '—',
      fastestDriver: '—',
    },
  },
  {
    slug: 'drt-2026',
    name: 'DRT 2026 × Vossen',
    date: 'March 2026',
    venue: 'Miami Beach Convention Center',
    type: 'Trade Show',
    description:
      'Full-motion sims at the DRT trade show in partnership with Vossen Wheels — where the automotive aftermarket meets sim racing.',
    sessions: [],
    stats: {
      totalDrivers: '—',
      totalLaps: '—',
      fastestLap: '—',
      fastestDriver: '—',
    },
  },
] as const
