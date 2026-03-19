import React, { useCallback, useState } from 'react'
import { useLeaderboard } from '../../../hooks/useLeaderboard'
import { useQueue } from '../../../hooks/useQueue'
import { useEventContext } from '../EventProvider'
import { useToast } from '../Toast'
import { Modal } from '../Modal'
import { formatGap, shortName } from '../../../lib/s4m/utils'
import type { Racer } from '../../../lib/s4m/types'

interface ResultsViewProps {
  role: 'admin' | 'employee'
}

export function ResultsView({ role }: ResultsViewProps) {
  const { event, apiUrl } = useEventContext()
  const { racers, refetch: refetchResults } = useLeaderboard(event.id)
  const leaderMs = racers[0]?.lap_time_ms ?? 0
  const { show } = useToast()
  const [deleteTarget, setDeleteTarget] = useState<Racer | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetPin, setResetPin] = useState('')

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await fetch(apiUrl(`/racer/${deleteTarget.id}`), { method: 'DELETE' })
      show('Entry deleted')
      setDeleteTarget(null)
    } catch {
      show('Error deleting entry')
    }
  }, [deleteTarget, apiUrl, show])

  const handleReset = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: resetPin }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      show('All data reset')
      setResetOpen(false)
      setResetPin('')
      refetchResults()
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Error resetting')
    }
  }, [apiUrl, resetPin, show, refetchResults])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1D1D1F' }}>Results</h2>
          <p style={{ fontSize: '12px', color: '#86868B', marginTop: '2px' }}>{racers.length} completed runs — sorted by lap time</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E5E7', overflow: 'hidden' }}>
        {racers.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#86868B' }}>No completed runs yet</p>
          </div>
        )}

        {racers.map((racer, i) => (
          <div key={racer.id} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: i < racers.length - 1 ? '1px solid #E5E5E7' : 'none',
          }}>
            <div style={{
              width: '32px',
              fontSize: '14px',
              fontWeight: 600,
              color: i < 3 ? '#E10600' : '#AEAEB2',
            }}>
              P{i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingLeft: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1D1D1F' }}>{shortName(racer.name)}</div>
              <div style={{ fontSize: '11px', color: '#AEAEB2' }}>
                {racer.lap_time_ms != null ? formatGap(leaderMs, racer.lap_time_ms) : ''}
              </div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1D1D1F', letterSpacing: '1px', fontVariantNumeric: 'tabular-nums', marginRight: role === 'admin' ? '12px' : 0 }}>
              {racer.lap_time}
            </div>
            {role === 'admin' && (
              <button
                onClick={() => setDeleteTarget(racer)}
                style={{ fontSize: '12px', color: '#FF3B30', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px' }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {role === 'admin' && (
        <div style={{ marginTop: '24px' }}>
          <button
            onClick={() => setResetOpen(true)}
            style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 500, color: '#FF3B30', border: '1px solid #FFD4D2', borderRadius: '10px', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Reset All Data
          </button>
          <p style={{ fontSize: '11px', color: '#AEAEB2', marginTop: '6px' }}>Permanently delete all drivers, times, and queue data</p>
        </div>
      )}

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Entry?" footer={
        <>
          <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: 500, border: '1px solid #E5E5E7', borderRadius: '10px', background: 'white', cursor: 'pointer', fontFamily: 'inherit', color: '#86868B' }}>Cancel</button>
          <button onClick={handleDelete} style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: 500, border: 'none', borderRadius: '10px', background: '#FF3B30', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
        </>
      }>
        <p style={{ fontSize: '14px', color: '#86868B' }}>Remove <strong style={{ color: '#1D1D1F' }}>{deleteTarget?.name}</strong> and their lap time?</p>
      </Modal>

      {/* Reset confirm */}
      <Modal isOpen={resetOpen} onClose={() => setResetOpen(false)} title="Reset All Data?" footer={
        <>
          <button onClick={() => setResetOpen(false)} style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: 500, border: '1px solid #E5E5E7', borderRadius: '10px', background: 'white', cursor: 'pointer', fontFamily: 'inherit', color: '#86868B' }}>Cancel</button>
          <button onClick={handleReset} disabled={resetPin.length < 4} style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: 500, border: 'none', borderRadius: '10px', background: '#FF3B30', color: 'white', cursor: resetPin.length >= 4 ? 'pointer' : 'not-allowed', opacity: resetPin.length >= 4 ? 1 : 0.35, fontFamily: 'inherit' }}>Confirm Reset</button>
        </>
      }>
        <p style={{ fontSize: '14px', color: '#86868B', marginBottom: '16px' }}>This will permanently delete all racers, times, and queue data.</p>
        <input
          type="password"
          inputMode="numeric"
          placeholder="Admin PIN"
          value={resetPin}
          onChange={e => setResetPin(e.target.value)}
          style={{ width: '100%', border: '1px solid #E5E5E7', borderRadius: '10px', padding: '12px', textAlign: 'center', letterSpacing: '6px', fontSize: '18px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </Modal>
    </>
  )
}
