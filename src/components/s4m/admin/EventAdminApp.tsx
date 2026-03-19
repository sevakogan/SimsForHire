import React, { useEffect, useState } from 'react'
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

const adminStyles = {
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  background: '#F5F5F7',
  minHeight: '100vh',
  color: '#1D1D1F',
} as const

export function EventAdminApp({ event, config, tab }: EventAdminAppProps) {
  const storageKey = `s4h_staff_${event.slug}`
  const [role, setRole] = useState<'admin' | 'employee' | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = sessionStorage.getItem(storageKey)
    return saved === 'admin' || saved === 'employee' ? saved : null
  })

  const handleAuthenticated = (r: 'admin' | 'employee') => {
    setRole(r)
    sessionStorage.setItem(storageKey, r)
  }

  if (!role) {
    return <PinGate eventSlug={event.slug} onAuthenticated={handleAuthenticated} />
  }

  return (
    <div style={adminStyles}>
      <EventProvider event={event} config={config}>
        <ToastProvider>
          {/* Header bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 28px',
            background: 'white',
            borderBottom: '1px solid #E5E5E7',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', background: '#1D1D1F', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '10px', fontWeight: 600 }}>S4H</span>
              </div>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F' }}>{config.event_name}</span>
                <span style={{ fontSize: '12px', color: '#86868B', marginLeft: '8px' }}>
                  {role === 'admin' ? 'Admin' : 'Employee'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={`/live/${event.slug}/leaderboard/tv`} style={{
                padding: '7px 14px', fontSize: '12px', fontWeight: 500, color: '#1D1D1F',
                border: '1px solid #E5E5E7', borderRadius: '8px', textDecoration: 'none',
              }}>TV View</a>
              <a href={`/live/${event.slug}`} style={{
                padding: '7px 14px', fontSize: '12px', fontWeight: 500, color: '#86868B',
                border: '1px solid #E5E5E7', borderRadius: '8px', textDecoration: 'none',
              }}>← Event</a>
            </div>
          </div>

          {/* Tab nav */}
          <div style={{
            display: 'flex',
            gap: '0',
            padding: '0 28px',
            background: 'white',
            borderBottom: '1px solid #E5E5E7',
          }}>
            {[
              { id: 'queue', label: 'Queue', href: `/live/${event.slug}/admin/queue` },
              { id: 'results', label: 'Results', href: `/live/${event.slug}/admin/results` },
              { id: 'settings', label: 'Settings', href: `/live/${event.slug}/admin/settings` },
            ].map(t => (
              <a
                key={t.id}
                href={t.href}
                style={{
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: tab === t.id ? 500 : 400,
                  color: tab === t.id ? '#1D1D1F' : '#86868B',
                  textDecoration: 'none',
                  borderBottom: tab === t.id ? '2px solid #E10600' : '2px solid transparent',
                }}
              >
                {t.label}
              </a>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: '28px' }}>
            {tab === 'queue' && <QueueManager role={role} />}
            {tab === 'results' && <ResultsView role={role} />}
            {tab === 'settings' && (
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E5E7', padding: '24px' }}>
                <p style={{ fontSize: '14px', color: '#86868B' }}>
                  Event settings are managed from the{' '}
                  <a href="/admin/events" style={{ color: '#1D1D1F', textDecoration: 'underline' }}>admin panel</a>.
                </p>
              </div>
            )}
          </div>
        </ToastProvider>
      </EventProvider>
    </div>
  )
}
