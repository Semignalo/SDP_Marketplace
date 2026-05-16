import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef(function Input(
  { label, error, hint, leadingIcon, trailingIcon, className = '', id, ...rest },
  ref,
) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-ink-soft tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full h-11 px-4 text-sm bg-paper border border-line rounded',
            'placeholder:text-ink-faint',
            'focus:outline-none focus:border-ink focus:ring-0',
            'transition-colors duration-200',
            leadingIcon && 'pl-10',
            trailingIcon && 'pr-10',
            error && 'border-state-danger',
            className,
          )}
          {...rest}
        />
        {trailingIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">
            {trailingIcon}
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-state-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', id, rows = 4, ...rest },
  ref,
) {
  const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-medium text-ink-soft tracking-wide">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cn(
          'block w-full px-4 py-3 text-sm bg-paper border border-line rounded resize-none',
          'placeholder:text-ink-faint',
          'focus:outline-none focus:border-ink',
          'transition-colors duration-200',
          error && 'border-state-danger',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-state-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
})
