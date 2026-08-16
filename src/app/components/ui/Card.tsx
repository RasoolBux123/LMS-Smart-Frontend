import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  hoverable?: boolean
}

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  hoverable = false
}: CardProps) {
  return (
    <div
      className={`rounded-[1.5rem] border border-border bg-card p-6 card-shadow transition-all duration-200 ${hoverable ? 'hover:-translate-y-1 hover:card-shadow-lg' : ''} ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-5">
          {title && (
            <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}