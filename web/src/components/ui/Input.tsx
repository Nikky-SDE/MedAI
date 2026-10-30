import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', leftIcon, error, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`w-full h-10 rounded-md border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-base shadow-xs transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed ${
            leftIcon ? 'pl-10 pr-3' : 'px-3.5'
          } ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900'
              : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-600'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          disabled={disabled}
          className={`w-full rounded-md border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-base p-3.5 shadow-xs transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed resize-none ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900'
              : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-600'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
