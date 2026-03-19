import React, { createContext, useCallback, useContext, useState } from 'react'

interface ToastContextType {
  show: (message: string) => void
}

const ToastContext = createContext<ToastContextType>({ show: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)

  const show = useCallback((msg: string) => {
    setMessage(msg)
    setVisible(true)
    setTimeout(() => setVisible(false), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className={`fixed bottom-6 right-6 z-[600] bg-black text-white font-mono text-[10px] tracking-[2px] px-5 py-3 uppercase border-l-[3px] shadow-lg transition-opacity duration-300 pointer-events-none ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ borderLeftColor: 'var(--yellow, #FFE400)', boxShadow: '4px 4px 0 var(--yellow, #FFE400)' }}
      >
        {message}
      </div>
    </ToastContext.Provider>
  )
}
