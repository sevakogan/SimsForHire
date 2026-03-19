export function timeToMs(time: string): number {
  const match = time.match(/(\d+):(\d+)\.(\d+)/)
  if (!match) return Infinity
  return (
    parseInt(match[1]) * 60000 +
    parseInt(match[2]) * 1000 +
    parseInt(match[3])
  )
}

export function formatGap(leaderMs: number, thisMs: number): string {
  if (thisMs === leaderMs) return 'Leader'
  const diff = (thisMs - leaderMs) / 1000
  return `+${diff.toFixed(3)}s`
}

export function formatQueuePos(pos: number): string {
  return pos.toString().padStart(2, '0')
}

/** "John Doe" → "John D." */
export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length < 2) return parts[0] || ''
  return `${parts[0]} ${parts[1][0]}.`
}
