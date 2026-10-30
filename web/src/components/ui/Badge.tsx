import * as React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'gray'
  withDot?: boolean
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'blue', withDot = false, children, ...props }, ref) => {
    const variants = {
      blue: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-500/20',
      green: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/20',
      amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-500/20',
      red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-500/20',
      gray: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700/30',
    }

    const dotColors = {
      blue: 'bg-blue-500',
      green: 'bg-emerald-500',
      amber: 'bg-amber-500',
      red: 'bg-red-500',
      gray: 'bg-slate-400',
    }

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium ${variants[variant]} ${className}`}
        {...props}
      >
        {withDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
