import React, { useCallback, useState } from 'react'
import { useQueue } from '../../../hooks/useQueue'
import { useEventContext } from '../EventProvider'
import { useToast } from '../Toast'
import { Modal } from '../Modal'
import type { Racer } from '../../../lib/s4m/types'

function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 6)
  if (digits.length === 0) return ''
  if (digits.length <= 1) return digits
  if (digits.length <= 3) return `${digits[0]}:${digits.slice(1)}`
  return `${digits[0]}:${digits.slice(1, 3)}.${digits.slice(3)}`
}

interface TimeEntryModalProps {
  isOpen: boolean
  onClose: () => void
  racer: Racer | null
  onSaved: () => void
}

function TimeEntryModal({ isOpen, onClose, racer, onSaved }: TimeEntryModalProps) {
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)
  const { show } = useToast()
  const { apiUrl } = useEventContext()

  const handleSave = useCallback(async () => {
    if (!racer || !time) return
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/time'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ racerId: racer.id, lapTime: time }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      show(`Time saved for ${racer.name}`)
      setTime('')
      onSaved()
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Error saving time')
    } finally {
      setLoading(false)
    }
  }, [racer, time, apiUrl, onSaved, show])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enter Lap Time" footer={
      <>
        <button onClick={onClose} style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: 500, border: '1px solid #E5E5E7', borderRadius: '10px', background: 'white', cursor: 'pointer', fontFamily: 'inherit', color: '#86868B' }}>Cancel</button>
        <button onClick={handleSave} disabled={!time || loading} style={{ flex: 2, padding: '12px', fontSize: '13px', fontWeight: 500, border: 'none', borderRadius: '10px', background: '#1D1D1F', color: 'white', cursor: !time || loading ? 'not-allowed' : 'pointer', opacity: !time || loading ? 0.35 : 1, fontFamily: 'inherit' }}>{loading ? 'Saving...' : 'Save & Send SMS'}</button>
      </>
    }>
      <p style={{ fontSize: '13px', color: '#86868B', marginBottom: '16px' }}>
        Driver: <strong style={{ color: '#1D1D1F' }}>{racer?.name}</strong>
      </p>
      <input
        type="tel"
        inputMode="numeric"
        value={time}
        onChange={e => setTime(formatTimeInput(e.target.value))}
        placeholder="0:00.000"
        style={{ width: '100%', border: '1px solid #E5E5E7', borderRadius: '10px', background: '#F5F5F7', fontSize: '36px', fontWeight: 600, letterSpacing: '4px', textAlign: 'center', padding: '16px', color: '#1D1D1F', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
      />
      <p style={{ fontSize: '11px', color: '#AEAEB2', textAlign: 'center', marginTop: '8px' }}>Format: M:SS.mmm</p>
    </Modal>
  )
}

interface QueueManagerProps {
  role: 'admin' | 'employee'
}

export function QueueManager({ role }: QueueManagerProps) {
  const { event, apiUrl } = useEventContext()
  const { queue, refetch } = useQueue(event.id)
  const { show } = useToast()
  const [selectedRacer, setSelectedRacer] = useState<Racer | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/racer/${id}`), { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      show('Removed from queue')
    } catch {
      show('Error removing racer')
    }
  }, [apiUrl, show])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1D1D1F' }}>Queue</h2>
          <p style={{ fontSize: '12px', color: '#86868B', marginTop: '2px' }}>{queue.length} drivers awaiting simulator</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E5E7', overflow: 'hidden' }}>
        {queue.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#86868B' }}>No drivers in queue</p>
          </div>
        )}

        {queue.map((racer, i) => (
          <div key={racer.id} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: i < queue.length - 1 ? '1px solid #E5E5E7' : 'none',
          }}>
            <div style={{ width: '32px', fontSize: '14px', fontWeight: 600, color: '#AEAEB2' }}>
              {(i + 1).toString().padStart(2, '0')}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingLeft: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1D1D1F' }}>{racer.name}</div>
              <div style={{ fontSize: '12px', color: '#86868B' }}>{racer.phone}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setSelectedRacer(racer); setModalOpen(true) }}
                style={{ padding: '7px 14px', fontSize: '12px', fontWeight: 500, background: '#1D1D1F', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Enter Time
              </button>
              {role === 'admin' && (
                <button
                  onClick={() => handleDelete(racer.id)}
                  style={{ padding: '7px 10px', fontSize: '12px', fontWeight: 500, color: '#FF3B30', border: '1px solid #FFD4D2', borderRadius: '8px', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <TimeEntryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        racer={selectedRacer}
        onSaved={() => { setModalOpen(false); refetch() }}
      />
    </>
  )
}
