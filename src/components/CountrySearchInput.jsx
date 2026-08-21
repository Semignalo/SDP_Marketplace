import { useEffect, useRef, useState } from 'react'
import { COUNTRIES } from '../lib/countries'
import { cn } from '../lib/utils'

export default function CountrySearchInput({ label = 'Country', value, onChange, error }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const query = (value || '').trim().toLowerCase()
  const matches = (query ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(query)) : COUNTRIES).slice(0, 8)

  return (
    <div ref={wrapRef} className="relative space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-ink-soft tracking-wide">{label}</label>
      )}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search or type a country"
        autoComplete="off"
        className={cn(
          'block w-full h-11 px-4 text-sm bg-paper border border-line rounded',
          'placeholder:text-ink-faint',
          'focus:outline-none focus:border-ink focus:ring-0',
          'transition-colors duration-200',
          error && 'border-state-danger',
        )}
      />
      {error ? <p className="text-xs text-state-danger">{error}</p> : null}

      {open && matches.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-paper rounded-lg shadow-hover max-h-48 overflow-y-auto border border-line">
          {matches.map((c) => (
            <li
              key={c.code}
              onMouseDown={() => {
                onChange(c.name)
                setOpen(false)
              }}
              className="px-3 py-2 text-sm cursor-pointer text-ink-soft hover:bg-paper-warm"
            >
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
