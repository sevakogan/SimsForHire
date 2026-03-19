import React, { useCallback, useState } from 'react'

interface PinGateProps {
  onAuthenticated: (role: 'admin' | 'employee') => void
  eventSlug: string
}

export function PinGate({ onAuthenticated, eventSlug }: PinGateProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/live-events/${eventSlug}/config`)
      const { config } = await res.json()

      if (pin === config.admin_pin) {
        onAuthenticated('admin')
      } else if (config.employee_pin && pin === config.employee_pin) {
        onAuthenticated('employee')
      } else {
        setError('Invalid PIN')
      }
    } catch {
      setError('Could not verify PIN')
    } finally {
      setLoading(false)
    }
  }, [pin, eventSlug, onAuthenticated])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#F5F5F7', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ maxWidth: '340px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', background: '#1D1D1F', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <span style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>S4H</span>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1D1D1F', letterSpacing: '-0.3px', marginBottom: '6px' }}>Event Staff</h1>
        <p style={{ fontSize: '13px', color: '#86868B', marginBottom: '32px' }}>Enter your PIN to access the event panel</p>

        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #E5E5E7' }}>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="••••"
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: '28px',
              letterSpacing: '12px',
              padding: '14px',
              border: `1px solid ${error ? '#FF3B30' : '#E5E5E7'}`,
              borderRadius: '10px',
              outline: 'none',
              fontFamily: 'inherit',
              color: '#1D1D1F',
              background: '#F5F5F7',
              boxSizing: 'border-box',
            }}
            autoFocus
          />

          {error && <p style={{ color: '#FF3B30', fontSize: '12px', marginTop: '8px' }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || pin.length < 4}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '14px',
              background: '#1D1D1F',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: pin.length >= 4 && !loading ? 'pointer' : 'not-allowed',
              opacity: pin.length >= 4 && !loading ? 1 : 0.35,
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Verifying...' : 'Enter'}
          </button>
        </div>

        <a href={`/live/${eventSlug}`} style={{ display: 'inline-block', marginTop: '20px', fontSize: '13px', color: '#86868B', textDecoration: 'none' }}>
          ← Back to event
        </a>
      </div>
    </div>
  )
}
