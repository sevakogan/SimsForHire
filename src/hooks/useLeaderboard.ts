import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '../lib/s4m/supabase-client'
import type { Racer } from '../lib/s4m/types'

export function useLeaderboard(eventId: string) {
  const [racers, setRacers] = useState<Racer[]>([])
  const supabaseRef = useRef(getSupabaseBrowserClient())

  const refetch = useCallback(() => {
    supabaseRef.current
      .from('racers')
      .select('*')
      .eq('event_id', eventId)
      .not('lap_time', 'is', null)
      .order('lap_time_ms', { ascending: true })
      .limit(15)
      .then(({ data }) => {
        if (data) setRacers(data)
      })
  }, [eventId])

  useEffect(() => {
    refetch()

    const channel = supabaseRef.current
      .channel(`leaderboard-${eventId}`)
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

  return { racers, refetch }
}
