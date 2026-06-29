import { useState, useEffect, useRef } from 'react'
import { useRajaOngkirCities, useRajaOngkirDistricts } from '../hooks/useAccount'
import { Spinner } from './ui/Spinner'

export default function CitySearchInput({ value, cityId, onChange, error }) {
  const [step, setStep] = useState('city') // 'city' | 'district'
  const [citySearch, setCitySearch] = useState(value || '')
  const [debouncedCitySearch, setDebouncedCitySearch] = useState('')
  const [selectedCity, setSelectedCity] = useState(null) // { city, province }
  const [districtSearch, setDistrictSearch] = useState('')
  const [debouncedDistrictSearch, setDebouncedDistrictSearch] = useState('')
  const [open, setOpen] = useState(false)
  const cityTimerRef = useRef(null)
  const districtTimerRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (cityTimerRef.current) clearTimeout(cityTimerRef.current)
    cityTimerRef.current = setTimeout(() => setDebouncedCitySearch(citySearch), 300)
    return () => clearTimeout(cityTimerRef.current)
  }, [citySearch])

  useEffect(() => {
    if (districtTimerRef.current) clearTimeout(districtTimerRef.current)
    districtTimerRef.current = setTimeout(() => setDebouncedDistrictSearch(districtSearch), 300)
    return () => clearTimeout(districtTimerRef.current)
  }, [districtSearch])

  const { data: cities = [], isFetching: citiesFetching } = useRajaOngkirCities(debouncedCitySearch)
  const { data: districts = [], isFetching: districtsFetching } = useRajaOngkirDistricts(
    selectedCity?.city || '',
    debouncedDistrictSearch
  )

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelectCity = (city) => {
    setSelectedCity(city)
    setStep('district')
    setDistrictSearch('')
    setDebouncedDistrictSearch('')
    setOpen(true)
  }

  const handleSelectDistrict = (district) => {
    const fullName = [district.name, selectedCity.city].filter(Boolean).join(', ')
    setDistrictSearch(district.name)
    setDebouncedDistrictSearch(district.name)
    setOpen(false)
    onChange({ name: fullName, id: district.id, province: district.province || selectedCity.province || '' })
  }

  const handleChangeCity = () => {
    setStep('city')
    setSelectedCity(null)
    setCitySearch('')
    setDebouncedCitySearch('')
    onChange({ name: '', id: null, province: '' })
  }

  const handleCityInput = (e) => {
    setCitySearch(e.target.value)
    setOpen(true)
    if (!e.target.value) onChange({ name: '', id: null, province: '' })
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-xs font-semibold text-ink-muted mb-1.5">
        City <span className="text-state-danger">*</span>
      </label>

      {step === 'city' && (
        <input
          type="text"
          value={citySearch}
          onChange={handleCityInput}
          onFocus={() => setOpen(true)}
          placeholder="Search city or regency..."
          className={[
            'w-full h-11 px-3 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink',
            error ? 'border-state-danger' : 'border-line',
          ].join(' ')}
          autoComplete="off"
        />
      )}

      {step === 'district' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium">
              {selectedCity.city}
              {selectedCity.province && <span className="text-ink-muted">, {selectedCity.province}</span>}
            </span>
            <button
              type="button"
              onClick={handleChangeCity}
              className="text-xs text-ink-muted underline hover:text-ink"
            >
              Change city
            </button>
          </div>
          <input
            type="text"
            value={districtSearch}
            onChange={(e) => {
              setDistrictSearch(e.target.value)
              setOpen(true)
              onChange({ name: '', id: null })
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search district/sub-district..."
            className={[
              'w-full h-11 px-3 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink',
              error ? 'border-state-danger' : 'border-line',
            ].join(' ')}
            autoComplete="off"
          />
        </div>
      )}

      {error && <p className="text-xs text-state-danger mt-1">{error}</p>}

      {open && step === 'city' && (
        <ul className="absolute z-50 w-full mt-1 bg-paper rounded-lg shadow-hover max-h-48 overflow-y-auto">
          {citiesFetching && (
            <li className="px-3 py-2 text-sm text-ink-muted flex items-center gap-2">
              <Spinner size={16} /> Searching...
            </li>
          )}
          {!citiesFetching && cities.length === 0 && debouncedCitySearch.trim().length >= 2 && (
            <li className="px-3 py-2 text-sm text-ink-muted">No cities found</li>
          )}
          {!citiesFetching && cities.map((city) => (
            <li
              key={city.city}
              onMouseDown={() => handleSelectCity(city)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-paper-soft"
            >
              <span className="font-medium">{city.city}</span>
              {city.province && <span className="text-ink-muted ml-1 text-xs">— {city.province}</span>}
            </li>
          ))}
        </ul>
      )}

      {open && step === 'district' && (
        <ul className="absolute z-50 w-full mt-1 bg-paper rounded-lg shadow-hover max-h-48 overflow-y-auto">
          {districtsFetching && (
            <li className="px-3 py-2 text-sm text-ink-muted flex items-center gap-2">
              <Spinner size={16} /> Searching...
            </li>
          )}
          {!districtsFetching && districts.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-muted">No districts found</li>
          )}
          {!districtsFetching && districts.map((district) => (
            <li
              key={district.id}
              onMouseDown={() => handleSelectDistrict(district)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-paper-soft"
            >
              <span className="font-medium">{district.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
