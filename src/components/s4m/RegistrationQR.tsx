import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useEventContext } from './EventProvider'

interface RegistrationQRProps {
  size?: number
}

export function RegistrationQR({ size = 72 }: RegistrationQRProps) {
  const { eventUrl } = useEventContext()
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(`${window.location.origin}${eventUrl('/register')}`)
  }, [eventUrl])

  if (!url) return null

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="font-bold text-[11px] tracking-[3px] text-white uppercase leading-tight">
          <div>Scan to</div>
          <div>Sign a</div>
          <div>Waiver</div>
        </div>
        <div className="font-mono text-[7px] tracking-[2px] text-white uppercase mt-1">
          &amp; Register to Race
        </div>
      </div>
      <QRCodeSVG
        value={url}
        size={size}
        bgColor="transparent"
        fgColor="#FFFFFF"
        level="M"
        includeMargin={false}
      />
    </div>
  )
}
