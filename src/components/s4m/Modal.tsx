import React, { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  maxWidth?: string
  footer?: React.ReactNode
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, maxWidth = '480px', footer, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full p-8"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h2 className="font-bold text-[11px] tracking-[3px] uppercase mb-6" style={{ color: 'var(--black, #0E0E0E)' }}>
            {title}
          </h2>
        )}
        {children}
        {footer && (
          <div className="flex gap-3 mt-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
