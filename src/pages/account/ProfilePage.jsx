import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUpdateProfile, useChangePassword } from '../../hooks/useAccount'
import { extractErrorMessage } from '../../lib/api'
import { Input, Button, Textarea } from '../../components/ui'
import TierBadge from '../../components/TierBadge'
import { formatRupiah, cn } from '../../lib/utils'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '' })
    }
  }, [user])

  const handleProfile = async (e) => {
    e.preventDefault()
    setErrors({})
    try {
      await updateProfile.mutateAsync(form)
      await fetchMe()
      toast.success('Profil diperbarui')
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        const e = {}
        Object.entries(apiErrors).forEach(([k, v]) => (e[k] = Array.isArray(v) ? v[0] : v))
        setErrors(e)
      } else {
        toast.error(extractErrorMessage(err))
      }
    }
  }

  return (
    <div className="space-y-12">
      <TierCard user={user} />

      <Section title="Informasi Pribadi" description="Perbarui detail kontak kamu.">
        <form onSubmit={handleProfile} className="space-y-5 max-w-md">
          <Input
            label="Nama Lengkap"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Input label="Email" value={user?.email || ''} disabled hint="Email tidak bisa diubah" />
          <Input
            label="Nomor HP"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+62..."
            error={errors.phone}
          />
          <Textarea
            label="Alamat Singkat"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={2}
            error={errors.address}
            hint="Untuk alamat pengiriman lengkap, gunakan tab Alamat."
          />
          <Button type="submit" loading={updateProfile.isPending}>
            Simpan Perubahan
          </Button>
        </form>
      </Section>

      <PasswordCard changePassword={changePassword} />
    </div>
  )
}

function PasswordCard({ changePassword }) {
  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})

  const handlePassword = async (e) => {
    e.preventDefault()
    setErrors({})

    if (pwd.password !== pwd.password_confirmation) {
      setErrors({ password_confirmation: 'Konfirmasi tidak cocok' })
      return
    }

    try {
      await changePassword.mutateAsync(pwd)
      toast.success('Password berhasil diubah')
      setPwd({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        const e = {}
        Object.entries(apiErrors).forEach(([k, v]) => (e[k] = Array.isArray(v) ? v[0] : v))
        setErrors(e)
      } else {
        toast.error(extractErrorMessage(err))
      }
    }
  }

  return (
    <Section title="Ubah Password" description="Pastikan menggunakan password yang kuat (minimal 8 karakter).">
      <form onSubmit={handlePassword} className="space-y-5 max-w-md">
        <Input
          label="Password Saat Ini"
          type="password"
          value={pwd.current_password}
          onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
          error={errors.current_password}
        />
        <Input
          label="Password Baru"
          type="password"
          value={pwd.password}
          onChange={(e) => setPwd({ ...pwd, password: e.target.value })}
          error={errors.password}
        />
        <Input
          label="Konfirmasi Password Baru"
          type="password"
          value={pwd.password_confirmation}
          onChange={(e) => setPwd({ ...pwd, password_confirmation: e.target.value })}
          error={errors.password_confirmation}
        />
        <Button type="submit" variant="outline" loading={changePassword.isPending}>
          Ubah Password
        </Button>
      </form>
    </Section>
  )
}

function Section({ title, description, children }) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="text-sm text-ink-muted mt-1">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function TierCard({ user }) {
  if (!user) return null
  const tier = user.tier
  const next = user.next_tier
  const spending = Number(user.total_spending || 0)

  // Progress menuju next tier (atau 100% kalau sudah top)
  const progress = next && next.min_spend > 0
    ? Math.min(100, (spending / next.min_spend) * 100)
    : 100

  return (
    <section className="border border-line rounded-lg overflow-hidden">
      <div className={cn(
        'px-6 py-5 flex items-center justify-between gap-4 flex-wrap',
        tier ? 'bg-ink text-white' : 'bg-paper-soft',
      )}>
        <div>
          <p className={cn('text-2xs uppercase tracking-[0.25em] mb-2', tier ? 'text-white/60' : 'text-ink-muted')}>
            Tier Loyalty Kamu
          </p>
          <div className="flex items-center gap-3">
            <TierBadge tier={tier} size="lg" />
            {tier && (
              <span className="text-sm font-medium opacity-90">Diskon {tier.discount}% di setiap order</span>
            )}
          </div>
        </div>
        <div className={cn('text-right', tier ? 'text-white' : 'text-ink')}>
          <p className={cn('text-2xs uppercase tracking-widest', tier ? 'text-white/60' : 'text-ink-muted')}>Total Belanja</p>
          <p className="text-2xl font-bold tabular-nums">{formatRupiah(spending)}</p>
          <p className={cn('text-2xs', tier ? 'text-white/50' : 'text-ink-faint')}>dari order completed</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {next ? (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-xs text-ink-muted">
                Belanja <strong className="text-ink tabular-nums">{formatRupiah(next.remaining)}</strong> lagi untuk naik ke
              </p>
              <TierBadge tier={next} size="sm" />
            </div>
            <div className="h-2 bg-line rounded-pill overflow-hidden">
              <div
                className="h-full bg-ink transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-2xs text-ink-faint mt-1 tabular-nums text-right">
              {formatRupiah(spending)} / {formatRupiah(next.min_spend)}
            </p>
          </div>
        ) : (
          <p className="text-xs text-state-success font-semibold">
            Selamat! Kamu sudah di tier tertinggi. 🎉
          </p>
        )}

        <details className="group">
          <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink list-none flex items-center gap-1.5">
            <span className="inline-block transition group-open:rotate-90">▸</span>
            Lihat semua tier & benefit
          </summary>
          <ul className="mt-3 space-y-1.5">
            <TierTableRow level={1} name="Member" minSpend={5000000} discount={10} active={tier?.level === 1} />
            <TierTableRow level={2} name="Silver" minSpend={10000000} discount={15} active={tier?.level === 2} />
            <TierTableRow level={3} name="Gold" minSpend={15000000} discount={20} active={tier?.level === 3} />
            <TierTableRow level={4} name="Platinum" minSpend={20000000} discount={25} active={tier?.level === 4} />
            <TierTableRow level={5} name="VIP" minSpend={25000000} discount={30} active={tier?.level === 5} />
          </ul>
          <p className="text-2xs text-ink-faint mt-3">
            Nama & nilai tier bisa diubah admin. Yang ditampilkan di atas adalah default.
          </p>
        </details>
      </div>
    </section>
  )
}

function TierTableRow({ level, name, minSpend, discount, active }) {
  return (
    <li className={cn(
      'flex items-center justify-between text-xs px-3 py-2 rounded',
      active ? 'bg-paper-warm font-semibold text-ink' : 'text-ink-soft',
    )}>
      <div className="flex items-center gap-2">
        <span className="w-5 text-center text-ink-faint tabular-nums">{level}</span>
        <span>{name}</span>
        {active && <span className="text-2xs text-state-success">• Aktif</span>}
      </div>
      <div className="flex items-center gap-4 tabular-nums text-ink-muted">
        <span>min {formatRupiah(minSpend)}</span>
        <span className="w-12 text-right font-semibold text-ink">{discount}%</span>
      </div>
    </li>
  )
}
