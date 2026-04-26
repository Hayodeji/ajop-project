import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white border border-slate-200/70 shadow-card',
        className,
      )}
    >
      {children}
    </div>
  )
}
