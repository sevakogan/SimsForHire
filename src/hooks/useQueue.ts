import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '../lib/s4m/supabase-client'
import type { Racer } from '../lib/s4m/types'

export function useQueue(eventId: string) {
  const [queue, setQueue] = useState<Racer[]>([])
  const supabaseRef = useRef(getSupabaseBrowserClient())

  const refetch = useCallback(() => {
    supabaseRef.current
      .from('racers')
      .select('*')
      .eq('event_id', eventId)
      .is('lap_time', null)
      .order('queue_pos', { ascending: true })
      .then(({ data }) => {
        if (data) setQueue(data)
      })
  }, [eventId])

  useEffect(() => {
    refetch()

    const channel = supabaseRef.current
      .channel(`queue-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'racers' },
        () => refetch(),
      )
      .subscribe()

    const interval = setInterval(refetch, 2000)

    return () => {
      supabaseRef.current.removeChannel(channel)
      clearInterval(interval)
    }
  }, [refetch, eventId])

  return { queue, refetch }
}
