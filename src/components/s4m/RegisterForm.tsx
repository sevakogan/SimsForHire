import React, { useCallback, useState } from 'react'
import { Input } from './Input'
import { WaiverModal } from './WaiverModal'
import { useToast } from './Toast'
import { useEventContext } from './EventProvider'

export function RegisterForm() {
  const { show } = useToast()
  const { config, eventUrl, apiUrl } = useEventContext()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [waiverOpen, setWaiverOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !phone.trim()) {
      show('Please fill in name and phone')
      return
    }
    if (!agreed) {
      show('Please agree to the waiver')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(apiUrl('/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Registration failed')

      const racer = data.racer
      const params = new URLSearchParams({
        name: racer.name,
        phone: racer.phone,
        queue: racer.queue_pos?.toString() ?? '1',
        id: racer.id,
      })
      window.location.href = `${eventUrl('/success')}?${params.toString()}`
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration error'
      show(msg)
    } finally {
      setLoading(false)
    }
  }, [name, phone, email, agreed, show, apiUrl, eventUrl])

  return (
    <>
      <div>
        <Input label="Full Name *" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Mobile Phone *" type="tel" placeholder="+1 (305) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
        <div className="mb-5">
          <label className="block font-mono text-[9px] tracking-[3px] uppercase mb-[10px]" style={{ color: 'var(--gray)' }}>
            Email Address <span className="text-[9px]" style={{ color: 'var(--gray)' }}>Optional</span>
          </label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-transparent border-0 border-b-[1.5px] text-[17px] font-bold py-[10px] outline-none transition-colors duration-200 placeholder:opacity-40"
            style={{ borderBottomColor: 'var(--border)', color: 'var(--black)' }}
          />
        </div>

        {/* Waiver checkbox */}
        <div className="border p-5 px-6 mb-5" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-start gap-[14px] cursor-pointer" onClick={() => setAgreed(prev => !prev)}>
            <div
              className="w-[18px] h-[18px] flex-shrink-0 mt-[2px] border-[1.5px] border-black flex items-center justify-center transition-all duration-150"
              style={agreed ? { backgroundColor: 'var(--yellow)' } : undefined}
            >
              {agreed && <span className="text-[11px] font-bold text-black">&#x2713;</span>}
            </div>
            <p className="font-mono text-[11px] leading-[1.9] tracking-[0.3px]" style={{ color: 'var(--gray)' }}>
              I agree to the{' '}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setWaiverOpen(true) }}
                className="underline cursor-pointer"
                style={{ color: 'var(--black)' }}
              >
                Liability Waiver
              </button>{' '}
              and consent to SMS notifications regarding my race results and event information.
            </p>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !agreed}
          className="w-full py-[18px] px-6 bg-black text-white font-bold text-xs tracking-[3px] uppercase cursor-pointer border-[1.5px] border-black transition-all duration-250 relative overflow-hidden group disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <span
            className="absolute inset-0 transform scale-y-0 origin-bottom transition-transform duration-300 ease-out group-hover:scale-y-100 group-disabled:hidden"
            style={{ backgroundColor: 'var(--yellow)' }}
          />
          <span className="relative z-10 group-hover:text-black transition-colors">
            {loading ? 'Registering...' : 'Register & Receive Confirmation \u2192'}
          </span>
        </button>
      </div>

      <WaiverModal
        isOpen={waiverOpen}
        onClose={() => setWaiverOpen(false)}
        onAgree={() => { setAgreed(true); setWaiverOpen(false) }}
        waiverHtml={config?.waiver_text}
      />
    </>
  )
}
