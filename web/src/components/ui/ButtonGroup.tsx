import * as React from 'react'

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex rounded-md shadow-sm isolate ${className}`}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child

          const isFirst = index === 0
          const isLast = index === React.Children.count(children) - 1

          const connectedRadius = isFirst
            ? 'rounded-l-md rounded-r-none'
            : isLast
            ? 'rounded-r-md rounded-l-none -ml-px'
            : 'rounded-none -ml-px'

          const childProps = child.props as { className?: string }

          return React.cloneElement(child, {
            className: `${childProps.className || ''} ${connectedRadius} focus:z-10`,
          } as React.Attributes)
        })}
      </span>
    )
  }
)

ButtonGroup.displayName = 'ButtonGroup'
