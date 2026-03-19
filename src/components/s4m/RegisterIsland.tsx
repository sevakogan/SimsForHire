import React from 'react'
import type { LiveEvent, EventConfig } from '../../lib/s4m/types'
import { EventProvider } from './EventProvider'
import { ToastProvider } from './Toast'
import { RegisterForm } from './RegisterForm'

interface Props {
  event: LiveEvent
  config: EventConfig
}

export function RegisterIsland({ event, config }: Props) {
  return (
    <EventProvider event={event} config={config}>
      <ToastProvider>
        <RegisterForm />
      </ToastProvider>
    </EventProvider>
  )
}
