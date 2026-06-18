import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  const hasCustomBg = /\bbg-/.test(className)
  const base = hasCustomBg
    ? 'rounded-xl border shadow-card'
    : 'rounded-xl bg-white border border-slate-200/70 shadow-card'

  return (
    <div className={`${base} ${className}`}>
      {children}
    </div>
  )
}
