import { useMemo, useState } from 'react'
import { Search, ScrollText, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminActivityLogs, exportAdminActivityLogs } from '../../hooks/useAdmin'
import { Input, Select, Badge, Button, Pagination, Skeleton, EmptyState } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatDateTime } from '../../lib/utils'

const LOG_GROUPS = [
  { value: '', label: 'All logs' },
  { value: 'auth', label: 'Auth' },
  { value: 'checkout', label: 'Checkout' },
  { value: 'order', label: 'Order (customer)' },
  { value: 'withdrawal', label: 'Withdrawal (reseller)' },
  { value: 'admin.product', label: 'Admin — Product' },
  { value: 'admin.user', label: 'Admin — User' },
  { value: 'admin.setting', label: 'Admin — Settings' },
  { value: 'admin.order', label: 'Admin — Order' },
  { value: 'admin.commission', label: 'Admin — Commission' },
  { value: 'admin.withdrawal', label: 'Admin — Withdrawal' },
]

export default function AdminActivityLogsPage() {
  const [search, setSearch] = useState('')
  const [logName, setLogName] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  const params = useMemo(() => ({
    page,
    ...(search && { search }),
    ...(logName && { log_name: logName }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
  }), [page, search, logName, dateFrom, dateTo])

  const { data, isLoading } = useAdminActivityLogs(params)

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportAdminActivityLogs(params)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Activity Logs</h2>
          <p className="text-sm text-ink-muted mt-1">Jejak aktivitas user & admin — checkout, perubahan admin, dll.</p>
        </div>
        <Button variant="outline" onClick={handleExport} loading={exporting} leadingIcon={<Download size={14} />}>
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leadingIcon={<Search size={14} />}
          />
        </div>
        <Select value={logName} onChange={(e) => { setLogName(e.target.value); setPage(1) }} className="md:w-56">
          {LOG_GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="md:w-44" />
        <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="md:w-44" />
      </div>

      <div className="bg-paper border border-line rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[140px_1fr_140px_140px] gap-4 px-5 py-3 bg-paper-soft border-b border-line eyebrow">
          <span>Waktu</span>
          <span>Deskripsi</span>
          <span>Pengguna</span>
          <span>Log</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="p-10"><EmptyState icon={<ScrollText size={40} strokeWidth={1.2} />} title="No activity yet" /></div>
        ) : (
          <ul className="divide-y divide-line">
            {data?.data?.map((a) => (
              <li key={a.id} className="p-4 md:px-5 md:grid md:grid-cols-[140px_1fr_140px_140px] md:gap-4 md:items-center">
                <p className="text-xs text-ink-muted tabular-nums">{formatDateTime(a.created_at)}</p>
                <p className="text-sm text-ink-soft mt-1 md:mt-0">{a.description}</p>
                <div className="mt-1 md:mt-0">
                  <p className="text-xs text-ink">{a.causer?.name || 'Guest/System'}</p>
                  {a.causer_role && <p className="text-2xs text-ink-muted">{a.causer_role}</p>}
                </div>
                <div className="mt-2 md:mt-0"><Badge variant="neutral">{a.log_name}</Badge></div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data?.meta?.last_page > 1 && (
        <Pagination currentPage={data.meta.current_page} lastPage={data.meta.last_page} onChange={setPage} />
      )}
    </div>
  )
}
