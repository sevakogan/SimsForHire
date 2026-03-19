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
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--light, #F5F4F0)' }}>
      <div className="max-w-xs w-full text-center">
        <h1 className="font-bold text-xl tracking-tight uppercase mb-2" style={{ color: 'var(--black)' }}>Event Staff</h1>
        <p className="font-mono text-[10px] tracking-[2px] uppercase mb-8" style={{ color: 'var(--gray)' }}>Enter admin PIN to continue</p>

        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter PIN"
          className="w-full text-center text-2xl tracking-[8px] border-[1.5px] py-4 outline-none transition-colors focus:border-black"
          style={{ borderColor: error ? '#ef4444' : 'var(--border)', color: 'var(--black)', backgroundColor: 'white' }}
          autoFocus
        />

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
          className="w-full mt-4 py-4 font-bold text-xs tracking-[3px] uppercase text-white cursor-pointer disabled:opacity-35"
          style={{ backgroundColor: 'var(--black)' }}
        >
          {loading ? 'Verifying...' : 'Enter →'}
        </button>
      </div>
    </div>
  )
}
