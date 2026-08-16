import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-foreground-soft">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-faint-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded-2xl border bg-input-background px-4 py-2.5 text-sm text-foreground shadow-sm transition-all duration-200 placeholder:text-faint-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/25 ${error ? 'border-danger' : 'border-input'} ${icon ? 'pl-10' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input