import React, { createContext, useCallback, useContext, useMemo } from 'react'
import type { LiveEvent, EventConfig } from '../../lib/s4m/types'

interface EventContextValue {
  readonly event: LiveEvent
  readonly config: EventConfig
  readonly eventUrl: (path: string) => string
  readonly apiUrl: (path: string) => string
}

const EventContext = createContext<EventContextValue | null>(null)

interface EventProviderProps {
  readonly event: LiveEvent
  readonly config: EventConfig
  readonly children: React.ReactNode
}

export function EventProvider({ event, config, children }: EventProviderProps) {
  const eventUrl = useCallback(
    (path: string) => `/live/${event.slug}${path === '/' ? '' : path}`,
    [event.slug],
  )

  const apiUrl = useCallback(
    (path: string) => `/api/live-events/${event.slug}${path}`,
    [event.slug],
  )

  const value = useMemo<EventContextValue>(
    () => ({ event, config, eventUrl, apiUrl }),
    [event, config, eventUrl, apiUrl],
  )

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  )
}

export function useEventContext(): EventContextValue {
  const ctx = useContext(EventContext)
  if (!ctx) {
    throw new Error('useEventContext must be used within an EventProvider')
  }
  return ctx
}
