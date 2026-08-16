import { ReactNode } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  isLoading?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  className = '',
  ...props
}: ButtonProps) {
  const variantStyles: Record<string, string> = {
    primary: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_16px_35px_-18px_rgba(79,70,229,0.85)] hover:from-indigo-500 hover:to-violet-500 focus:ring-ring',
    secondary: 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-[0_16px_35px_-18px_rgba(13,148,136,0.85)] hover:from-teal-500 hover:to-cyan-500 focus:ring-ring',
    success: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-[0_16px_35px_-18px_rgba(34,197,94,0.85)] hover:from-emerald-500 hover:to-green-500 focus:ring-ring',
    danger: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-[0_16px_35px_-18px_rgba(239,68,68,0.85)] hover:from-rose-500 hover:to-red-500 focus:ring-ring',
    outline: 'border border-border-strong bg-input-background text-foreground-soft hover:border-primary hover:text-primary hover:bg-primary-soft/70 focus:ring-ring'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg'
  }

  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantStyles[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}