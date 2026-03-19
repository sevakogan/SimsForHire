import React from 'react'
import type { Racer } from '../../lib/s4m/types'
import { formatGap, shortName } from '../../lib/s4m/utils'

interface EntryRowProps {
  racer: Racer
  position: number
  leaderMs: number
}

export function EntryRow({ racer, position, leaderMs }: EntryRowProps) {
  const pos = position
  const isP1 = pos === 1
  const isP2 = pos === 2
  const isP3 = pos === 3
  const isTop3 = pos <= 3

  const entryBg = isP1
    ? 'py-[22px]'
    : isP2
    ? 'bg-white/[0.04] py-[18px]'
    : isP3
    ? 'bg-white/[0.02] py-4'
    : 'py-[14px]'

  const entryBorder = isP1
    ? 'border-[var(--yellow)]'
    : isP2
    ? 'border-white/[0.12]'
    : isP3
    ? 'border-white/[0.08]'
    : 'border-white/[0.05]'

  const sizeScale = isP1 ? 'text-[40px]' : isP2 ? 'text-[32px]' : isP3 ? 'text-[26px]' : 'text-[20px]'
  const nameScale = isP1 ? 'text-[36px]' : isP2 ? 'text-[28px]' : isP3 ? 'text-[22px]' : 'text-[18px]'

  const gap = racer.lap_time_ms != null
    ? formatGap(leaderMs, racer.lap_time_ms)
    : ''

  return (
    <div
      className={`flex items-center px-5 border transition-all duration-300 ${entryBg} ${entryBorder}`}
      style={isP1 ? { backgroundColor: 'var(--yellow, #FFE400)', borderColor: 'var(--yellow, #FFE400)' } : undefined}
    >
      <div className={`font-bold leading-none min-w-[48px] sm:min-w-[72px] text-white font-mono ${sizeScale}`}>
        {pos.toString().padStart(2, '0')}
      </div>
      <div className="flex-1 px-5">
        <div className={`font-medium uppercase tracking-[1px] text-white font-mono ${nameScale}`}>
          {shortName(racer.name)}
        </div>
        {(isTop3 || gap) && (
          <div className="font-mono text-[10px] mt-1 tracking-[2px] text-white/70">
            {isP1 ? `Leader \u00B7 +0.000s` : gap}
          </div>
        )}
      </div>
      <div className="text-right flex items-center gap-2 justify-end">
        <div className={`font-bold tracking-[1px] leading-none text-white font-mono ${sizeScale}`}>
          {racer.lap_time}
        </div>
        {isP1 && <span className="text-[28px] sm:text-[36px] leading-none">🥇</span>}
        {isP2 && <span className="text-[24px] sm:text-[30px] leading-none">🥈</span>}
        {isP3 && <span className="text-[20px] sm:text-[26px] leading-none">🥉</span>}
      </div>
    </div>
  )
}
