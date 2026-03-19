export const prerender = false
import type { APIRoute } from 'astro'
import { createServiceClient } from '../../../../lib/supabase'
import { resolveEventSlug } from '../../../../lib/s4m/event-helpers'
import * as XLSX from 'xlsx'

export const GET: APIRoute = async ({ params }) => {
  const eventId = await resolveEventSlug(params.eventSlug!)
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 })
  }

  const supabase = createServiceClient()
  const { data: racers, error } = await supabase
    .from('racers')
    .select('*')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!racers || racers.length === 0) {
    return new Response(JSON.stringify({ error: 'No registrations found' }), { status: 404 })
  }

  // De-duplicate by phone number
  const seen = new Set<string>()
  const unique = racers.filter(r => {
    const key = r.phone?.replace(/\D/g, '') ?? r.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const rows = unique.map((r, i) => ({
    '#': i + 1,
    'Name': r.name ?? '',
    'Phone': r.phone ?? '',
    'Email': r.email ?? '',
    'Queue Position': r.queue_pos ?? '',
    'Lap Time': r.lap_time ?? '',
    'Lap Time (ms)': r.lap_time_ms ?? '',
    'Registered At': r.registered_at ? new Date(r.registered_at).toLocaleString() : '',
    'Completed At': r.completed_at ? new Date(r.completed_at).toLocaleString() : '',
    'SMS Sent': r.sms_sent ? 'Yes' : 'No',
    'SMS Status': r.sms_status ?? '',
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  const colWidths = Object.keys(rows[0] ?? {}).map(key => ({
    wch: Math.max(
      key.length,
      ...rows.map(r => String(r[key as keyof typeof r] ?? '').length),
    ) + 2,
  }))
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Registered Users')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const filename = `registrations-${new Date().toISOString().slice(0, 10)}.xlsx`

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
