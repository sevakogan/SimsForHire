import React from 'react'
import type { LiveEvent, EventConfig } from '../../lib/s4m/types'
import { EventProvider } from './EventProvider'
import { ToastProvider } from './Toast'
import { LeaderboardLive } from './LeaderboardLive'

interface Props {
  event: LiveEvent
  config: EventConfig
}

export function LeaderboardIsland({ event, config }: Props) {
  return (
    <EventProvider event={event} config={config}>
      <ToastProvider>
        <LeaderboardLive />
      </ToastProvider>
    </EventProvider>
  )
}
