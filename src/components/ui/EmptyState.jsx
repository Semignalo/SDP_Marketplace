import { cn } from '../../lib/utils'

export function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      {icon && (
        <div className="mb-4 text-ink-faint">{icon}</div>
      )}
      <h3 className="text-base font-semibold text-ink mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-ink-muted max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}
