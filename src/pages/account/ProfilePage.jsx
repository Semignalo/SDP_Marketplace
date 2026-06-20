import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUpdateProfile, useChangePassword } from '../../hooks/useAccount'
import { extractErrorMessage } from '../../lib/api'
import { Card, Input, Button, Textarea } from '../../components/ui'
import TierBadge from '../../components/TierBadge'
import { formatRupiah, cn } from '../../lib/utils'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => { fetchMe() }, [])

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
      toast.success('Profile updated')
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

      <Section title="Personal Information" description="Keep your contact details up to date.">
        <form onSubmit={handleProfile} className="space-y-5 max-w-md">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Input label="Email" value={user?.email || ''} disabled hint="Email can't be changed" />
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+62..."
            error={errors.phone}
          />
          <Textarea
            label="Short Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={2}
            error={errors.address}
            hint="For full shipping addresses, use the Addresses tab."
          />
          <Button type="submit" loading={updateProfile.isPending}>
            Save changes
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
      setErrors({ password_confirmation: "Passwords don't match" })
      return
    }

    try {
      await changePassword.mutateAsync(pwd)
      toast.success('Password changed')
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
    <Section title="Change Password" description="Use a strong password — at least 8 characters.">
      <form onSubmit={handlePassword} className="space-y-5 max-w-md">
        <Input
          label="Current Password"
          type="password"
          value={pwd.current_password}
          onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
          error={errors.current_password}
        />
        <Input
          label="New Password"
          type="password"
          value={pwd.password}
          onChange={(e) => setPwd({ ...pwd, password: e.target.value })}
          error={errors.password}
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={pwd.password_confirmation}
          onChange={(e) => setPwd({ ...pwd, password_confirmation: e.target.value })}
          error={errors.password_confirmation}
        />
        <Button type="submit" variant="outline" loading={changePassword.isPending}>
          Change password
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

// Gradient per tier level: neutral ink ramping up to accent/gold for top tiers
const TIER_GRADIENT = {
  1: 'bg-gradient-to-r from-ink to-ink-soft',
  2: 'bg-gradient-to-r from-ink to-ink-muted',
  3: 'bg-gradient-to-r from-ink to-accent',
  4: 'bg-gradient-to-r from-ink to-accent-hover',
  5: 'bg-gradient-to-r from-ink to-rating',
}

function TierCard({ user }) {
  if (!user) return null
  const tier = user.tier
  const next = user.next_tier
  const spending = Number(user.total_spending || 0)

  const progress = next && next.min_spend > 0
    ? Math.min(100, (spending / next.min_spend) * 100)
    : 100

  const headerBg = tier ? (TIER_GRADIENT[tier.level] || TIER_GRADIENT[1]) : 'bg-paper-soft'

  return (
    <Card padding="none" className="overflow-hidden">
      <div className={cn(
        'px-6 py-5 flex items-center justify-between gap-4 flex-wrap',
        headerBg,
        tier && 'text-white',
      )}>
        <div>
          <p className={cn('text-2xs uppercase tracking-eyebrow mb-2', tier ? 'text-white/60' : 'text-ink-muted')}>
            Your Loyalty Tier
          </p>
          <div className="flex items-center gap-3">
            <TierBadge tier={tier} size="lg" onDark={!!tier} />
            {tier && (
              <span className="text-sm font-medium text-white/90">{tier.discount}% off every order</span>
            )}
          </div>
        </div>
        <div className={cn('text-right', tier ? 'text-white' : 'text-ink')}>
          <p className={cn('text-2xs uppercase tracking-widest', tier ? 'text-white/60' : 'text-ink-muted')}>Total Spent</p>
          <p className="text-2xl font-bold tabular-nums">{formatRupiah(spending)}</p>
          <p className={cn('text-2xs', tier ? 'text-white/50' : 'text-ink-muted')}>from completed orders</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {next ? (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-xs text-ink-muted">
                Spend <strong className="text-ink tabular-nums">{formatRupiah(next.remaining)}</strong> more to reach
              </p>
              <TierBadge tier={next} size="sm" />
            </div>
            <div className="h-2 bg-line rounded-pill overflow-hidden">
              <div
                className="h-full bg-ink transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-2xs text-ink-muted mt-1 tabular-nums text-right">
              {formatRupiah(spending)} / {formatRupiah(next.min_spend)}
            </p>
          </div>
        ) : (
          <p className="text-xs text-state-success font-semibold">
            You've hit the top tier. Nicely done.
          </p>
        )}

        <details className="group">
          <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink list-none flex items-center gap-1.5">
            <span className="inline-block transition group-open:rotate-90">▸</span>
            See all tiers & benefits
          </summary>
          <ul className="mt-3 space-y-1.5">
            {(user?.all_tiers || []).map((t) => (
              <TierTableRow key={t.level} level={t.level} name={t.name} minSpend={t.min_spend} discount={t.discount} active={tier?.level === t.level} />
            ))}
          </ul>
          <p className="text-2xs text-ink-muted mt-3">
            Tier names and thresholds can be customized by admins. Shown above are the defaults.
          </p>
        </details>
      </div>
    </Card>
  )
}

function TierTableRow({ level, name, minSpend, discount, active }) {
  return (
    <li className={cn(
      'flex items-center justify-between text-xs px-3 py-2 rounded',
      active ? 'bg-paper-warm font-semibold text-ink' : 'text-ink-soft',
    )}>
      <div className="flex items-center gap-2">
        <span className="w-5 text-center text-ink-muted tabular-nums">{level}</span>
        <span>{name}</span>
        {active && <span className="text-2xs text-state-success">• Current</span>}
      </div>
      <div className="flex items-center gap-4 tabular-nums text-ink-muted">
        <span>min {formatRupiah(minSpend)}</span>
        <span className="w-12 text-right font-semibold text-ink">{discount}%</span>
      </div>
    </li>
  )
}
