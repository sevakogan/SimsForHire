import React from 'react'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useConfig } from '../../hooks/useConfig'
import { EntryRow } from './EntryRow'
import { RegistrationQR } from './RegistrationQR'
import { useEventContext } from './EventProvider'

export function LeaderboardLive() {
  const { event } = useEventContext()
  const { racers } = useLeaderboard(event.id)
  const config = useConfig(event.id)

  const leaderMs = racers[0]?.lap_time_ms ?? 0
  const brandLogo = config?.logo_left || ''
  const sponsorLogos = [
    config?.logo_right, config?.logo_3, config?.logo_4,
  ].filter(Boolean) as string[]

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: 'var(--black, #0E0E0E)' }}>
      {/* Subtle gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 120% 80% at 50% -10%, color-mix(in srgb, var(--yellow, #FFE400) 6%, transparent) 0%, transparent 60%)`,
      }} />

      {/* Accent bar */}
      <div className="h-1 flex-shrink-0 relative z-10" style={{ backgroundColor: 'var(--yellow, #FFE400)' }} />

      {/* Header */}
      <div className="flex relative z-10 flex-shrink-0 border-b border-white/[0.07]">
        <div className="flex-1 min-w-0">
          <div className="px-5 sm:px-8 lg:px-12 py-3 lg:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 lg:gap-4">
              {brandLogo ? (
                <img src={brandLogo} alt="" className="h-[28px] lg:h-[36px] w-auto object-contain flex-shrink-0" />
              ) : (
                <div className="w-[36px] h-[36px] rounded-full border-2 flex-shrink-0" style={{ borderColor: 'var(--yellow, #FFE400)' }} />
              )}
              <div>
                <div className="font-bold text-[10px] lg:text-[12px] tracking-[4px] uppercase text-white leading-tight">
                  {config?.dealer_name ?? 'Sims For Hire'}
                </div>
                <div className="font-mono text-[7px] lg:text-[8px] tracking-[2px] text-white mt-[2px]">
                  Sim Racing
                </div>
              </div>
            </div>
            <div className="text-white flex items-center gap-2 font-mono text-[9px] lg:text-[11px] tracking-[3px] uppercase sm:hidden">
              <div className="w-[6px] h-[6px] rounded-full bg-white animate-pulse" />
              Live
            </div>
          </div>

          <div className="px-5 sm:px-8 lg:px-12 pb-3 lg:pb-4">
            <h1 className="font-bold text-[24px] sm:text-[30px] lg:text-[36px] leading-[1] tracking-[-1px] uppercase text-white">
              {config?.event_name ?? 'Simulator Challenge'}
            </h1>
            {(config?.event_date || config?.event_time) && (
              <div className="font-mono text-[8px] lg:text-[10px] tracking-[2px] text-white mt-2">
                {config.event_date && new Date(config.event_date + 'T00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {config.event_date && config.event_time && ' | '}
                {config.event_time && new Date('2000-01-01T' + config.event_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </div>
            )}
            <div className="font-mono text-[8px] lg:text-[10px] tracking-[2px] text-white mt-2">
              Presented by @ShiftArcadeMiami &amp; @SimsForHire
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center pr-5 sm:pr-8 lg:pr-12 pl-4">
          <div className="flex items-center gap-2">
            <div className="text-white flex items-center gap-2 font-mono text-[9px] lg:text-[11px] tracking-[3px] uppercase mr-4">
              <div className="w-[6px] h-[6px] rounded-full bg-white animate-pulse" />
              Live
            </div>
            <RegistrationQR size={120} />
          </div>
        </div>
      </div>

      {/* Sponsor logos */}
      {sponsorLogos.length > 0 && (
        <div className="px-5 sm:px-8 lg:px-12 py-2 border-b border-white/[0.05] flex items-center justify-center gap-8 flex-shrink-0 relative z-10">
          {sponsorLogos.map((src, i) => (
            <img key={i} src={src} alt="" style={{ height: '80px' }} className="w-auto object-contain opacity-80" />
          ))}
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center px-5 sm:px-8 lg:px-12 py-3 font-mono text-[9px] tracking-[3px] uppercase text-white/70 border-b border-white/[0.05] flex-shrink-0 relative z-10">
        <span className="min-w-[48px] sm:min-w-[72px]">Rank</span>
        <span className="flex-1 pl-3 sm:pl-5">Driver</span>
        <span>Best Lap</span>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-hidden px-5 sm:px-8 lg:px-12 py-3 flex flex-col gap-[3px] relative z-10">
        {racers.map((racer, i) => (
          <EntryRow
            key={racer.id}
            racer={racer}
            position={i + 1}
            leaderMs={leaderMs}
          />
        ))}
        {racers.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-mono text-[11px] tracking-[3px] text-white/70 uppercase">
              No times recorded yet
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
