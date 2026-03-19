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
        <button onClick={onClose} className="flex-1 py-3 text-[11px] font-bold tracking-[2px] uppercase border-[1.5px] bg-transparent" style={{ borderColor: 'var(--border)', color: 'var(--black)' }}>Cancel</button>
        <button onClick={handleSave} disabled={!time || loading} className="flex-[2] py-3 text-[11px] font-bold tracking-[2px] uppercase border-[1.5px] border-black bg-black text-white disabled:opacity-35">{loading ? 'Saving...' : 'Save & Send SMS →'}</button>
      </>
    }>
      <div className="font-mono text-[10px] tracking-[2px] mb-4 uppercase" style={{ color: 'var(--gray)' }}>
        Driver: <strong style={{ color: 'var(--black)' }}>{racer?.name}</strong>
      </div>
      <input
        type="tel"
        inputMode="numeric"
        value={time}
        onChange={e => setTime(formatTimeInput(e.target.value))}
        placeholder="0:00.000"
        className="w-full border-[1.5px] text-4xl font-bold tracking-[4px] text-center py-4 outline-none focus:border-black"
        style={{ borderColor: 'var(--border)', color: 'var(--black)', backgroundColor: 'var(--light)' }}
      />
      <div className="font-mono text-[9px] text-center mt-2 tracking-[2px]" style={{ color: 'var(--gray)' }}>Format: M:SS.mmm</div>
    </Modal>
  )
}

interface QueueManagerProps {
  role: 'admin' | 'employee'
}

export function QueueManager({ role }: QueueManagerProps) {
  const { event, apiUrl, eventUrl } = useEventContext()
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
      {/* Admin nav */}
      <div className="flex border-b px-6 bg-white" style={{ borderColor: 'var(--border)' }}>
        <a href={eventUrl('/admin/queue')} className="no-underline py-3 mr-8 font-mono text-[10px] tracking-[2px] uppercase border-b-2" style={{ color: 'var(--black)', borderColor: 'var(--yellow)' }}>Queue ({queue.length})</a>
        <a href={eventUrl('/admin/results')} className="no-underline py-3 mr-8 font-mono text-[10px] tracking-[2px] uppercase border-b-2 border-transparent" style={{ color: 'var(--gray)' }}>Results</a>
        <a href={eventUrl('/admin/settings')} className="no-underline py-3 mr-8 font-mono text-[10px] tracking-[2px] uppercase border-b-2 border-transparent" style={{ color: 'var(--gray)' }}>Settings</a>
      </div>

      <div className="p-6 max-w-[900px]">
        <div className="font-mono text-[9px] tracking-[3px] uppercase mb-4" style={{ color: 'var(--gray)' }}>Drivers awaiting simulator</div>

        {queue.length === 0 && (
          <p className="font-mono text-[11px] tracking-[2px] py-12 text-center" style={{ color: 'var(--gray)' }}>No drivers in queue</p>
        )}

        {queue.map((racer, i) => (
          <div key={racer.id} className="flex items-center py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-8 font-mono text-sm font-bold" style={{ color: 'var(--gray)' }}>{(i + 1).toString().padStart(2, '0')}</div>
            <div className="flex-1 min-w-0 px-3">
              <div className="font-bold text-sm uppercase truncate" style={{ color: 'var(--black)' }}>{racer.name}</div>
              <div className="font-mono text-[9px]" style={{ color: 'var(--gray)' }}>{racer.phone}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedRacer(racer); setModalOpen(true) }}
                className="px-4 py-2 text-[10px] font-bold tracking-[2px] uppercase text-white"
                style={{ backgroundColor: 'var(--black)' }}
              >
                Enter Time
              </button>
              {role === 'admin' && (
                <button
                  onClick={() => handleDelete(racer.id)}
                  className="px-3 py-2 text-[10px] font-bold tracking-[1px] uppercase text-red-500 border border-red-200 bg-transparent hover:bg-red-50"
                >
                  ×
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
