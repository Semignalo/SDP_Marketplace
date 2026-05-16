import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const VARIANTS = {
  primary: 'bg-ink text-white hover:bg-ink-soft active:bg-ink-soft',
  secondary: 'bg-paper text-ink border border-ink hover:bg-ink hover:text-white',
  outline: 'border border-line bg-paper text-ink hover:bg-paper-soft hover:border-line-strong',
  ghost: 'text-ink hover:bg-paper-warm',
  danger: 'bg-state-danger text-white hover:opacity-90',
  link: 'text-ink underline-offset-4 hover:underline px-0 py-0 h-auto',
}

const SIZES = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-sm',
  icon: 'h-10 w-10 p-0',
}

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    leadingIcon = null,
    trailingIcon = null,
    className = '',
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded font-medium tracking-wide transition-all duration-200 ease-soft select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-pill animate-spin" />
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  )
})
