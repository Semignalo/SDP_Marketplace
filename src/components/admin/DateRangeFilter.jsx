import { useMemo, useState } from 'react'
import { Select, Input } from '../ui'

const RANGE_PRESETS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
]

// State filter tanggal admin → `params` siap dikirim ke API (all | days | date_from+date_to).
export function useDateRange(defaultRange = '30') {
  const [range, setRange] = useState(defaultRange)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const params = useMemo(() => {
    if (range === 'all') return { all: 1 }
    if (range === 'custom') return customFrom && customTo ? { date_from: customFrom, date_to: customTo } : { days: 30 }
    return { days: Number(range) }
  }, [range, customFrom, customTo])

  return { range, setRange, customFrom, setCustomFrom, customTo, setCustomTo, params }
}

export default function DateRangeFilter({ range, setRange, customFrom, setCustomFrom, customTo, setCustomTo }) {
  return (
    <div className="flex items-center gap-2">
      <Select value={range} onChange={(e) => setRange(e.target.value)} className="text-xs w-36">
        {RANGE_PRESETS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </Select>
      {range === 'custom' && (
        <>
          <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-36" />
          <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-36" />
        </>
      )}
    </div>
  )
}
