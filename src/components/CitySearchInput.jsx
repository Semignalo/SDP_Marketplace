import { useState, useEffect, useRef } from 'react'
import { useRajaOngkirCities } from '../hooks/useAccount'
import { Spinner } from './ui/Spinner'

export default function CitySearchInput({ value, cityId, onChange, error }) {
  const [search, setSearch] = useState(value || '')
  const [open, setOpen] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const timerRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timerRef.current)
  }, [search])

  const { data: cities = [], isFetching } = useRajaOngkirCities(debouncedSearch)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (city) => {
    setSearch(city.name)
    setOpen(false)
    onChange({ name: city.name, id: city.id })
  }

  const handleInput = (e) => {
    setSearch(e.target.value)
    setOpen(true)
    if (!e.target.value) onChange({ name: '', id: null })
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-xs font-semibold text-ink-muted mb-1.5">
        Alamat <span className="text-state-danger">*</span>
      </label>
      <input
        type="text"
        value={search}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        placeholder="Cari kecamatan, kelurahan, atau kota..."
        className={[
          'w-full h-11 px-3 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink',
          error ? 'border-state-danger' : 'border-line',
        ].join(' ')}
        autoComplete="off"
      />
      {error && <p className="text-xs text-state-danger mt-1">{error}</p>}
      {open && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-line rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {isFetching && (
            <li className="px-3 py-2 text-sm text-ink-muted flex items-center gap-2">
              <Spinner size={16} /> Mencari...
            </li>
          )}
          {!isFetching && cities.length === 0 && debouncedSearch.trim().length >= 2 && (
            <li className="px-3 py-2 text-sm text-ink-muted">Lokasi tidak ditemukan</li>
          )}
          {!isFetching && cities.map((city) => (
            <li
              key={city.id}
              onMouseDown={() => handleSelect(city)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-paper-soft"
            >
              <span className="font-medium">{city.name}</span>
              {city.province && <span className="text-ink-muted ml-1 text-xs">— {city.province}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
