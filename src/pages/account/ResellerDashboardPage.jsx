import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Check, Wallet, Users, Package, TrendingUp, ArrowDownToLine, X } from 'lucide-react'
import { toast } from 'sonner'
import { useResellerSummary, useResellerCommissions, useResellerNetwork, useResellerWithdrawals, useSubmitWithdrawal } from '../../hooks/useReseller'
import { Badge, Skeleton, EmptyState, Pagination, Button, Input, Modal } from '../../components/ui'
import { extractErrorMessage } from '../../lib/api'
import { formatRupiah, formatDate, cn } from '../../lib/utils'

const STATUS_LABELS = {
  pending: { label: 'Menunggu', variant: 'warning' },
  earned:  { label: 'Dikonfirmasi', variant: 'neutral' },
  paid:    { label: 'Dibayar', variant: 'success' },
  cancelled: { label: 'Dibatalkan', variant: 'danger' },
}

const WITHDRAWAL_STATUS = {
  pending:  { label: 'Diproses', variant: 'warning' },
  approved: { label: 'Disetujui', variant: 'success' },
  rejected: { label: 'Ditolak', variant: 'danger' },
}

const FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'earned', label: 'Dikonfirmasi' },
  { value: 'paid', label: 'Dibayar' },
]

const TABS = [
  { value: 'komisi', label: 'Komisi' },
  { value: 'penarikan', label: 'Penarikan' },
  { value: 'jaringan', label: 'Jaringan' },
]

const EMPTY_FORM = { amount: '', bank_name: '', bank_account_number: '', bank_account_name: '', notes: '' }

export default function ResellerDashboardPage() {
  const { data: summary, isLoading: sumLoading } = useResellerSummary()
  const [tab, setTab] = useState('komisi')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const params = useMemo(() => ({ page, ...(status && { status }) }), [page, status])
  const { data: commissionData, isLoading: comLoading } = useResellerCommissions(params)
  const { data: withdrawalData, isLoading: wdLoading } = useResellerWithdrawals()
  const { data: network, isLoading: netLoading } = useResellerNetwork()
  const submitWithdrawal = useSubmitWithdrawal()

  const [copied, setCopied] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})

  const referralUrl = summary?.reseller_code
    ? `${window.location.origin}/register?ref=${summary.reseller_code}`
    : ''

  const availableBalance = summary?.earned || 0
  const hasPendingWithdrawal = withdrawalData?.data?.some(w => w.status === 'pending')

  const handleCopy = async () => {
    if (!referralUrl) return
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      toast.success('Link referral disalin')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin')
    }
  }

  const handleOpenModal = () => {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setModalOpen(true)
  }

  const handleSubmitWithdrawal = async () => {
    setFormErrors({})
    try {
      await submitWithdrawal.mutateAsync({
        ...form,
        amount: Number(form.amount),
      })
      toast.success('Permintaan penarikan berhasil dikirim!')
      setModalOpen(false)
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        const e = {}
        Object.entries(apiErrors).forEach(([k, v]) => (e[k] = Array.isArray(v) ? v[0] : v))
        setFormErrors(e)
      } else {
        toast.error(extractErrorMessage(err))
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Dashboard Komisi</h2>
          <p className="text-sm text-ink-muted mt-1">Pantau komisi & link referral kamu.</p>
        </div>
        <Button
          leadingIcon={<ArrowDownToLine size={15} />}
          onClick={handleOpenModal}
          disabled={availableBalance <= 0 || hasPendingWithdrawal}
          size="sm"
        >
          Tarik Komisi
        </Button>
      </div>

      {hasPendingWithdrawal && (
        <div className="px-4 py-3 bg-state-warning/10 border border-state-warning/30 rounded text-xs text-ink-soft">
          Ada permintaan penarikan yang sedang diproses. Tunggu hingga selesai sebelum mengajukan yang baru.
        </div>
      )}

      {/* Referral link card */}
      <div className="border border-line rounded-lg p-5 bg-paper-soft">
        <p className="text-2xs uppercase tracking-widest text-ink-muted mb-2">Link Referral Kamu</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2.5 bg-paper border border-line rounded text-sm text-ink tabular-nums truncate">
            {referralUrl || '—'}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!referralUrl}
            className={cn(
              'h-11 px-4 inline-flex items-center gap-2 rounded text-sm font-medium transition',
              copied ? 'bg-state-success text-white' : 'bg-ink text-white hover:bg-ink-soft disabled:opacity-50',
            )}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Bagikan link ini. Setiap pembelian customer via link kamu otomatis dapat komisi
          {summary?.rate && <strong className="text-ink"> {summary.rate}%</strong>}.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Wallet size={18} />} label="Total Komisi" value={sumLoading ? null : formatRupiah(summary?.total_earned || 0)} accent />
        <StatCard icon={<TrendingUp size={18} />} label="Siap Ditarik" value={sumLoading ? null : formatRupiah(summary?.earned || 0)} />
        <StatCard icon={<Package size={18} />} label="Total Order" value={sumLoading ? null : (summary?.orders_count || 0).toString()} />
        <StatCard icon={<Users size={18} />} label="Pelanggan Unik" value={sumLoading ? null : (summary?.customers_count || 0).toString()} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px',
              tab === t.value ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {t.label}
            {t.value === 'jaringan' && network?.length > 0 && (
              <span className="ml-1.5 text-2xs bg-ink text-white rounded-full px-1.5 py-0.5">{network.length}</span>
            )}
            {t.value === 'penarikan' && withdrawalData?.data?.filter(w => w.status === 'pending').length > 0 && (
              <span className="ml-1.5 text-2xs bg-state-warning text-white rounded-full px-1.5 py-0.5">
                {withdrawalData.data.filter(w => w.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Komisi */}
      {tab === 'komisi' && <>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => { setStatus(f.value); setPage(1) }}
              className={cn(
                'shrink-0 px-3.5 py-1.5 rounded-pill text-xs font-medium transition border',
                status === f.value ? 'bg-ink text-white border-ink' : 'bg-paper text-ink-soft border-line hover:border-ink',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <section className="border border-line rounded-lg overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_1fr_120px] gap-4 px-5 py-3 bg-paper-soft border-b border-line text-2xs font-bold uppercase tracking-widest text-ink-muted">
            <span>Pesanan</span><span>Customer</span><span>Tanggal</span>
            <span className="text-right">Komisi</span><span className="text-right">Status</span>
          </div>
          {comLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : commissionData?.data?.length === 0 ? (
            <div className="p-10"><EmptyState icon={<Wallet size={40} strokeWidth={1.2} />} title="Belum ada komisi" description="Bagikan link referral kamu untuk mulai dapat komisi." /></div>
          ) : (
            <ul className="divide-y divide-line">
              {commissionData?.data?.map((c) => {
                const s = STATUS_LABELS[c.status] || { label: c.status, variant: 'neutral' }
                return (
                  <li key={c.id} className="p-4 md:px-5 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_120px] md:gap-4 md:items-center">
                    <div>
                      <Link to={`/akun/pesanan/${c.order?.order_number}`} className="text-sm font-semibold tabular-nums text-ink hover:underline">
                        {c.order?.order_number || '—'}
                      </Link>
                      <p className="text-xs text-ink-muted mt-0.5 tabular-nums">Total: {formatRupiah(c.order_total)}</p>
                    </div>
                    <p className="text-sm text-ink-soft mt-2 md:mt-0">
                      {c.customer?.name || c.guest_name || '—'}
                      {!c.customer && c.guest_name && (
                        <span className="ml-1.5 text-2xs px-1.5 py-0.5 bg-paper-warm text-ink-muted rounded">Tamu</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-muted mt-1 md:mt-0 tabular-nums">{formatDate(c.created_at)}</p>
                    <div className="md:text-right mt-2 md:mt-0">
                      <p className="text-sm font-bold text-ink tabular-nums">{formatRupiah(c.amount)}</p>
                      <p className="text-2xs text-ink-faint tabular-nums">rate {c.rate}%</p>
                    </div>
                    <div className="md:text-right mt-2 md:mt-0"><Badge variant={s.variant}>{s.label}</Badge></div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        {commissionData?.meta?.last_page > 1 && (
          <Pagination currentPage={commissionData.meta.current_page} totalPages={commissionData.meta.last_page} onPageChange={setPage} />
        )}
      </>}

      {/* Tab: Penarikan */}
      {tab === 'penarikan' && (
        <section className="border border-line rounded-lg overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_1.2fr_120px_140px] gap-4 px-5 py-3 bg-paper-soft border-b border-line text-2xs font-bold uppercase tracking-widest text-ink-muted">
            <span>Tanggal</span><span>Rekening</span><span className="text-right">Jumlah</span><span>Status</span>
          </div>
          {wdLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !withdrawalData?.data?.length ? (
            <div className="p-10">
              <EmptyState icon={<ArrowDownToLine size={40} strokeWidth={1.2} />} title="Belum ada penarikan" description="Klik 'Tarik Komisi' untuk mengajukan penarikan saldo." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {withdrawalData.data.map((w) => {
                const s = WITHDRAWAL_STATUS[w.status] || { label: w.status, variant: 'neutral' }
                return (
                  <li key={w.id} className="p-4 md:px-5 md:grid md:grid-cols-[1fr_1.2fr_120px_140px] md:gap-4 md:items-center">
                    <p className="text-xs text-ink-muted tabular-nums">{formatDate(w.created_at)}</p>
                    <div className="mt-1 md:mt-0">
                      <p className="text-sm text-ink">{w.bank_name} — {w.bank_account_number}</p>
                      <p className="text-xs text-ink-muted">a.n. {w.bank_account_name}</p>
                    </div>
                    <p className="text-sm font-bold tabular-nums md:text-right mt-2 md:mt-0">{formatRupiah(w.amount)}</p>
                    <div className="mt-2 md:mt-0">
                      <Badge variant={s.variant}>{s.label}</Badge>
                      {w.admin_notes && <p className="text-2xs text-ink-muted mt-1">{w.admin_notes}</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {/* Tab: Jaringan */}
      {tab === 'jaringan' && (
        <section className="border border-line rounded-lg overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_80px] gap-4 px-5 py-3 bg-paper-soft border-b border-line text-2xs font-bold uppercase tracking-widest text-ink-muted">
            <span>Member</span><span>Bergabung</span><span className="text-right">Order</span>
          </div>
          {netLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !network?.length ? (
            <div className="p-10"><EmptyState icon={<Users size={40} strokeWidth={1.2} />} title="Belum ada jaringan" description="Bagikan link referral kamu agar orang lain bergabung." /></div>
          ) : (
            <ul className="divide-y divide-line">
              {network.map((u) => (
                <li key={u.id} className="p-4 md:px-5 md:grid md:grid-cols-[2fr_1fr_80px] md:gap-4 md:items-center">
                  <div>
                    <p className="text-sm font-medium text-ink">{u.name}</p>
                    <p className="text-xs text-ink-muted">{u.email}</p>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 md:mt-0 tabular-nums">{formatDate(u.joined_at)}</p>
                  <p className="text-sm font-semibold text-ink md:text-right mt-1 md:mt-0 tabular-nums">{u.orders_count} order</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Modal Tarik Komisi */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tarik Komisi"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSubmitWithdrawal} loading={submitWithdrawal.isPending} leadingIcon={<ArrowDownToLine size={15} />}>
              Ajukan Penarikan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="px-4 py-3 bg-paper-soft rounded text-sm">
            Saldo tersedia (Dikonfirmasi):{' '}
            <span className="font-bold text-ink">{formatRupiah(availableBalance)}</span>
          </div>

          <Input
            label="Jumlah Penarikan (Rp)"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder={`Maks. ${formatRupiah(availableBalance)}`}
            error={formErrors.amount}
          />
          <Input
            label="Nama Bank"
            value={form.bank_name}
            onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            placeholder="BCA, BNI, Mandiri, dll"
            error={formErrors.bank_name}
          />
          <Input
            label="Nomor Rekening"
            value={form.bank_account_number}
            onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
            placeholder="1234567890"
            error={formErrors.bank_account_number}
          />
          <Input
            label="Nama Pemilik Rekening"
            value={form.bank_account_name}
            onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
            placeholder="Sesuai buku tabungan"
            error={formErrors.bank_account_name}
          />
          <div>
            <label className="text-xs font-medium text-ink-soft block mb-1.5">Catatan (opsional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Catatan tambahan untuk admin"
              className="w-full px-3 py-2.5 text-sm border border-line rounded focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function StatCard({ icon, label, value, accent = false }) {
  return (
    <div className={cn('border rounded-lg p-5', accent ? 'bg-ink text-white border-ink' : 'bg-paper border-line')}>
      <div className={cn('flex items-center gap-2 text-2xs uppercase tracking-widest', accent ? 'text-white/60' : 'text-ink-muted')}>
        {icon}<span>{label}</span>
      </div>
      <div className="mt-3 min-h-[28px]">
        {value === null
          ? <Skeleton className={cn('h-6 w-24', accent && 'bg-white/20')} />
          : <p className="text-xl md:text-2xl font-bold tabular-nums">{value}</p>}
      </div>
    </div>
  )
}
