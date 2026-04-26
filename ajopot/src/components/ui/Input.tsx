import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftAdornment?: ReactNode
  rightAdornment?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, leftAdornment, rightAdornment, className, id, ...props },
    ref,
  ) => {
    const inputId = id ?? props.name
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex items-center rounded-lg border bg-white transition-colors',
            'focus-within:ring-2 focus-within:ring-brand-600 focus-within:border-brand-600',
            error ? 'border-rose-400' : 'border-slate-200',
          )}
        >
          {leftAdornment && (
            <span className="flex items-center shrink-0 gap-1.5 pl-3 pr-2.5 border-r border-slate-200 text-slate-700 text-sm font-medium select-none whitespace-nowrap self-stretch">
              {leftAdornment}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
              'focus:outline-none h-11',
              leftAdornment ? 'pl-3 pr-3' : 'px-3',
              className,
            )}
            {...props}
          />
          {rightAdornment && (
            <span className="flex items-center shrink-0 pr-3 pl-2.5 border-l border-slate-200 text-slate-500 text-sm select-none whitespace-nowrap self-stretch">
              {rightAdornment}
            </span>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-600">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    )
  },
)
Input.displayName = 'Input'
