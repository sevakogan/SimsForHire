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
  const { event, apiUrl, eventUrl } = useEventContext()
  const { racers, refetch: refetchResults } = useLeaderboard(event.id)
  const { queue } = useQueue(event.id)
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
      <div className="flex border-b px-6 bg-white" style={{ borderColor: 'var(--border)' }}>
        <a href={eventUrl('/admin/queue')} className="no-underline py-3 mr-8 font-mono text-[10px] tracking-[2px] uppercase border-b-2 border-transparent" style={{ color: 'var(--gray)' }}>Queue ({queue.length})</a>
        <a href={eventUrl('/admin/results')} className="no-underline py-3 mr-8 font-mono text-[10px] tracking-[2px] uppercase border-b-2" style={{ color: 'var(--black)', borderColor: 'var(--yellow)' }}>Results ({racers.length})</a>
        <a href={eventUrl('/admin/settings')} className="no-underline py-3 mr-8 font-mono text-[10px] tracking-[2px] uppercase border-b-2 border-transparent" style={{ color: 'var(--gray)' }}>Settings</a>
      </div>

      <div className="p-6 max-w-[900px]">
        <div className="font-mono text-[9px] tracking-[3px] uppercase mb-4" style={{ color: 'var(--gray)' }}>Completed runs — sorted by lap time</div>

        {racers.length === 0 && (
          <p className="font-mono text-[11px] tracking-[2px] py-12 text-center" style={{ color: 'var(--gray)' }}>No completed runs yet</p>
        )}

        {racers.map((racer, i) => (
          <div key={racer.id} className="flex items-center py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-8 font-bold text-sm" style={{ color: i < 3 ? 'var(--yellow)' : 'var(--gray)' }}>P{i + 1}</div>
            <div className="flex-1 min-w-0 px-3">
              <div className="font-bold text-sm uppercase truncate" style={{ color: 'var(--black)' }}>{shortName(racer.name)}</div>
              <div className="font-mono text-[9px]" style={{ color: 'var(--gray)' }}>{racer.lap_time_ms ? formatGap(leaderMs, racer.lap_time_ms) : ''}</div>
            </div>
            <div className="font-mono font-bold text-lg tracking-[1px] mr-4" style={{ color: 'var(--black)' }}>{racer.lap_time}</div>
            {role === 'admin' && (
              <button onClick={() => setDeleteTarget(racer)} className="text-red-400 hover:text-red-600 text-xs">×</button>
            )}
          </div>
        ))}

        {role === 'admin' && (
          <div className="mt-10 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setResetOpen(true)} className="px-6 py-3 text-[10px] font-bold tracking-[2px] uppercase border-[1.5px] border-red-300 text-red-500 bg-transparent hover:bg-red-50">
              Reset All Data
            </button>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Entry?" footer={
        <>
          <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 text-[11px] font-bold tracking-[2px] uppercase border bg-transparent" style={{ borderColor: 'var(--border)' }}>Cancel</button>
          <button onClick={handleDelete} className="flex-1 py-3 text-[11px] font-bold tracking-[2px] uppercase bg-red-500 text-white border border-red-500">Delete</button>
        </>
      }>
        <p className="text-sm" style={{ color: 'var(--gray)' }}>Remove <strong style={{ color: 'var(--black)' }}>{deleteTarget?.name}</strong> and their lap time?</p>
      </Modal>

      {/* Reset confirm */}
      <Modal isOpen={resetOpen} onClose={() => setResetOpen(false)} title="Reset All Data?" footer={
        <>
          <button onClick={() => setResetOpen(false)} className="flex-1 py-3 text-[11px] font-bold tracking-[2px] uppercase border bg-transparent" style={{ borderColor: 'var(--border)' }}>Cancel</button>
          <button onClick={handleReset} disabled={resetPin.length < 4} className="flex-1 py-3 text-[11px] font-bold tracking-[2px] uppercase bg-red-500 text-white border border-red-500 disabled:opacity-35">Confirm Reset</button>
        </>
      }>
        <p className="text-sm mb-4" style={{ color: 'var(--gray)' }}>This will permanently delete all racers, times, and queue data.</p>
        <input type="password" inputMode="numeric" placeholder="Admin PIN" value={resetPin} onChange={e => setResetPin(e.target.value)} className="w-full border-[1.5px] py-3 text-center tracking-[4px] outline-none" style={{ borderColor: 'var(--border)' }} />
      </Modal>
    </>
  )
}
