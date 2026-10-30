import * as React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', padding = 'md', children, ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    return (
      <div
        ref={ref}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800 ${className}`} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => (
    <h3 ref={ref} className={`text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-snug ${className}`} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <p ref={ref} className={`text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed ${className}`} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`pt-4 ${className}`} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`flex items-center pt-4 border-t border-slate-100 dark:border-slate-800 ${className}`} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'
