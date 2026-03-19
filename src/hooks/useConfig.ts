import { useEffect, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '../lib/s4m/supabase-client'
import type { EventConfig } from '../lib/s4m/types'

export function useConfig(eventId: string) {
  const [config, setConfig] = useState<EventConfig | null>(null)
  const supabaseRef = useRef(getSupabaseBrowserClient())

  useEffect(() => {
    const fetchConfig = () => {
      supabaseRef.current
        .from('event_config')
        .select('*')
        .eq('event_id', eventId)
        .single()
        .then(({ data }) => {
          if (data) setConfig(data as EventConfig)
        })
    }

    fetchConfig()

    const channel = supabaseRef.current
      .channel(`config-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_config' },
        () => fetchConfig(),
      )
      .subscribe()

    return () => {
      supabaseRef.current.removeChannel(channel)
    }
  }, [eventId])

  return config
}
