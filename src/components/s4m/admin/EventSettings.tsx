import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useEventContext } from '../EventProvider'
import { useToast } from '../Toast'
import type { EventConfig } from '../../../lib/s4m/types'

function ShareLink({ event }: { event: { slug: string } }) {
  const [copied, setCopied] = useState(false)
  const staffUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/live/${event.slug}/admin`
    : `/live/${event.slug}/admin`
  const eventUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/live/${event.slug}`
    : `/live/${event.slug}`

  const handleCopy = () => {
    navigator.clipboard.writeText(staffUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ background: '#EEF6FF', borderRadius: '12px', border: '1px solid #BFD8F5', padding: '20px 24px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F', marginBottom: '4px' }}>Share with Staff</h3>
      <p style={{ fontSize: '12px', color: '#5A7DA8', marginBottom: '14px' }}>Send this link to employees running the event — they'll enter their PIN to access the panel</p>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          readOnly
          value={staffUrl}
          onClick={e => (e.target as HTMLInputElement).select()}
          style={{
            flex: 1, padding: '10px 14px', border: '1px solid #BFD8F5', borderRadius: '8px',
            fontSize: '13px', fontFamily: 'monospace', color: '#2563EB', background: 'white',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleCopy}
          style={{
            padding: '10px 18px', fontSize: '13px', fontWeight: 500,
            background: copied ? '#30D158' : '#2563EB', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
            whiteSpace: 'nowrap', transition: 'background 0.2s',
          }}
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <a
          href={eventUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '10px 18px', fontSize: '13px', fontWeight: 500,
            background: 'white', color: '#2563EB',
            border: '1px solid #BFD8F5', borderRadius: '8px', textDecoration: 'none',
            fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}
        >
          Preview Event
        </a>
      </div>
    </div>
  )
}

interface EventSettingsProps {
  role: 'admin' | 'employee'
}

export function EventSettings({ role }: EventSettingsProps) {
  const { event, apiUrl } = useEventContext()
  const { show } = useToast()
  const [config, setConfig] = useState<EventConfig | null>(null)
  const [saving, setSaving] = useState(false)

  // Local form state
  const [dealerName, setDealerName] = useState('')
  const [eventName, setEventName] = useState('')
  const [trackName, setTrackName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [adminPin, setAdminPin] = useState('')
  const [employeePin, setEmployeePin] = useState('')
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [logoLeft, setLogoLeft] = useState('')
  const [logoRight, setLogoRight] = useState('')
  const [logo3, setLogo3] = useState('')
  const [logo4, setLogo4] = useState('')

  useEffect(() => {
    fetch(apiUrl('/config'))
      .then(r => r.json())
      .then(({ config: c }) => {
        if (!c) return
        setConfig(c)
        setDealerName(c.dealer_name || '')
        setEventName(c.event_name || '')
        setTrackName(c.track_name || '')
        setEventDate(c.event_date || '')
        setEventTime(c.event_time || '')
        setAdminPin(c.admin_pin || '')
        setEmployeePin(c.employee_pin || '')
        setSmsEnabled(c.sms_enabled ?? false)
        setLogoLeft(c.logo_left || '')
        setLogoRight(c.logo_right || '')
        setLogo3(c.logo_3 || '')
        setLogo4(c.logo_4 || '')
      })
  }, [apiUrl])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(apiUrl('/config'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealer_name: dealerName,
          event_name: eventName,
          track_name: trackName,
          event_date: eventDate,
          event_time: eventTime,
          admin_pin: adminPin,
          employee_pin: employeePin,
          sms_enabled: smsEnabled,
          logo_left: logoLeft,
          logo_right: logoRight,
          logo_3: logo3,
          logo_4: logo4,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      show('Settings saved')
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Error saving')
    } finally {
      setSaving(false)
    }
  }, [apiUrl, dealerName, eventName, trackName, eventDate, eventTime, adminPin, employeePin, smsEnabled, logoLeft, logoRight, logo3, logo4, show])

  if (!config) {
    return <p style={{ fontSize: '14px', color: '#86868B', padding: '24px' }}>Loading settings...</p>
  }

  if (role === 'employee') {
    return (
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E5E7', padding: '24px' }}>
        <p style={{ fontSize: '14px', color: '#86868B' }}>Settings are only available to admins.</p>
      </div>
    )
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #E5E5E7',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    color: '#1D1D1F',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500 as const,
    color: '#86868B',
    marginBottom: '6px',
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1D1D1F' }}>Settings</h2>
          <p style={{ fontSize: '12px', color: '#86868B', marginTop: '2px' }}>Configure event details and access</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 500, background: '#1D1D1F', color: 'white', border: 'none', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, fontFamily: 'inherit' }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Share with Staff */}
      <ShareLink event={event} />

      {/* Event Details */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E5E7', padding: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F', marginBottom: '16px' }}>Event Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Event Name</label>
            <input value={eventName} onChange={e => setEventName(e.target.value)} style={inputStyle} placeholder="Simulator Challenge" />
          </div>
          <div>
            <label style={labelStyle}>Dealer / Sponsor Name</label>
            <input value={dealerName} onChange={e => setDealerName(e.target.value)} style={inputStyle} placeholder="Sims For Hire" />
          </div>
          <div>
            <label style={labelStyle}>Track Name</label>
            <input value={trackName} onChange={e => setTrackName(e.target.value)} style={inputStyle} placeholder="Circuit" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Time</label>
              <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* Access & Security */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E5E7', padding: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F', marginBottom: '16px' }}>Access & Security</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Admin PIN</label>
            <input value={adminPin} onChange={e => setAdminPin(e.target.value)} style={inputStyle} placeholder="4+ digits" />
            <p style={{ fontSize: '11px', color: '#AEAEB2', marginTop: '4px' }}>Full access — can delete entries and reset data</p>
          </div>
          <div>
            <label style={labelStyle}>Employee PIN</label>
            <input value={employeePin} onChange={e => setEmployeePin(e.target.value)} style={inputStyle} placeholder="Optional" />
            <p style={{ fontSize: '11px', color: '#AEAEB2', marginTop: '4px' }}>Limited access — can enter times but not delete</p>
          </div>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setSmsEnabled(!smsEnabled)}
            style={{
              width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: smsEnabled ? '#30D158' : '#E5E5E7',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: '20px', height: '20px', borderRadius: '10px', background: 'white',
              position: 'absolute', top: '2px', left: smsEnabled ? '22px' : '2px',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }} />
          </button>
          <span style={{ fontSize: '14px', color: '#1D1D1F' }}>SMS Notifications</span>
          <span style={{ fontSize: '12px', color: '#AEAEB2' }}>Send confirmation texts to drivers</span>
        </div>
      </div>

      {/* Branding */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E5E7', padding: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F', marginBottom: '16px' }}>Branding & Logos</h3>
        <p style={{ fontSize: '12px', color: '#AEAEB2', marginBottom: '16px' }}>Paste image URLs for logos displayed on the leaderboard and emails</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Primary Logo (left)</label>
            <input value={logoLeft} onChange={e => setLogoLeft(e.target.value)} style={inputStyle} placeholder="https://..." />
          </div>
          <div>
            <label style={labelStyle}>Sponsor Logo (right)</label>
            <input value={logoRight} onChange={e => setLogoRight(e.target.value)} style={inputStyle} placeholder="https://..." />
          </div>
          <div>
            <label style={labelStyle}>Additional Logo 1</label>
            <input value={logo3} onChange={e => setLogo3(e.target.value)} style={inputStyle} placeholder="https://..." />
          </div>
          <div>
            <label style={labelStyle}>Additional Logo 2</label>
            <input value={logo4} onChange={e => setLogo4(e.target.value)} style={inputStyle} placeholder="https://..." />
          </div>
        </div>
      </div>
    </>
  )
}
