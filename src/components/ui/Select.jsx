import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder = '— Pilih —', className = '', id, children, ...rest },
  ref,
) {
  const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-ink-soft tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'block w-full h-11 pl-4 pr-10 text-sm bg-paper border border-line rounded',
            'appearance-none cursor-pointer',
            'focus:outline-none focus:border-ink',
            'transition-colors duration-200',
            error && 'border-state-danger',
            className,
          )}
          {...rest}
        >
          {children ?? (
            <>
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </>
          )}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
      </div>
      {error ? (
        <p className="text-xs text-state-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
})
