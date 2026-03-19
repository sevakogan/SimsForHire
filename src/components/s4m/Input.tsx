import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function Input({ label, hint, className = '', ...props }: InputProps) {
  return (
    <div className="mb-5">
      {label && (
        <label className="block font-mono text-[9px] tracking-[3px] uppercase mb-[10px]" style={{ color: 'var(--gray, #555)' }}>
          {label}
        </label>
      )}
      <input
        className={`w-full bg-transparent border-0 border-b-[1.5px] text-[17px] font-bold py-[10px] outline-none transition-colors duration-200 placeholder:opacity-40 ${className}`}
        style={{
          borderBottomColor: 'var(--border, #C0BFB8)',
          color: 'var(--black, #0E0E0E)',
        }}
        {...props}
      />
      {hint && (
        <p className="font-mono text-[9px] mt-2 tracking-[2px]" style={{ color: 'var(--gray, #555)' }}>{hint}</p>
      )}
    </div>
  )
}
