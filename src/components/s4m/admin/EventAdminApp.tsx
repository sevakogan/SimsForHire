import React, { useState } from 'react'
import type { LiveEvent, EventConfig } from '../../../lib/s4m/types'
import { EventProvider } from '../EventProvider'
import { ToastProvider } from '../Toast'
import { PinGate } from './PinGate'
import { QueueManager } from './QueueManager'
import { ResultsView } from './ResultsView'

interface EventAdminAppProps {
  event: LiveEvent
  config: EventConfig
  tab: 'queue' | 'results' | 'settings'
}

export function EventAdminApp({ event, config, tab }: EventAdminAppProps) {
  const [role, setRole] = useState<'admin' | 'employee' | null>(null)

  if (!role) {
    return <PinGate eventSlug={event.slug} onAuthenticated={setRole} />
  }

  return (
    <EventProvider event={event} config={config}>
      <ToastProvider>
        {/* Header */}
        <div className="px-6 py-3 flex items-center justify-between" style={{ backgroundColor: 'var(--black)' }}>
          <div className="font-mono text-[11px] tracking-[3px] uppercase text-white/90">
            Event Staff — {role === 'admin' ? 'Admin' : 'Employee'}
          </div>
          <div className="flex gap-2">
            <a href={`/races/live/${event.slug}/leaderboard/tv`} className="no-underline px-4 py-2 text-[10px] font-bold tracking-[2px] uppercase border border-white/30 text-white/90 hover:border-white/70">TV</a>
            <a href={`/races/live/${event.slug}`} className="no-underline px-4 py-2 text-[10px] font-bold tracking-[2px] uppercase border border-white/30 text-white/90 hover:border-white/70">← Home</a>
          </div>
        </div>

        {tab === 'queue' && <QueueManager role={role} />}
        {tab === 'results' && <ResultsView role={role} />}
        {tab === 'settings' && (
          <div className="p-6">
            <p className="font-mono text-sm" style={{ color: 'var(--gray)' }}>
              Event settings are managed from the <a href="/admin/events" className="underline" style={{ color: 'var(--black)' }}>admin panel</a>.
            </p>
          </div>
        )}
      </ToastProvider>
    </EventProvider>
  )
}
