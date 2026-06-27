import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { Button } from '../components/ui'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const resend = async () => {
    if (!email) return
    setLoading(true)
    try {
      await api.post('/auth/email/resend', { email })
      setSent(true)
      toast.success('Verification email resent!')
    } catch (err) {
      const msg = err.response?.data?.message || "Couldn't resend the email."
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-paper-soft px-5 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ink/5 mb-6">
          <Mail size={28} className="text-ink" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Check your email</h1>
        <p className="text-sm text-ink-muted mt-3 leading-relaxed">
          We sent a verification link to{' '}
          <strong className="text-ink">{email || 'your email'}</strong>.
          Click the link to activate your account.
        </p>

        <div className="mt-8 bg-paper border border-line rounded-lg p-6 space-y-4 text-left">
          <p className="text-xs text-ink-muted">Didn't get the email?</p>
          <ul className="text-xs text-ink-soft space-y-1.5 list-disc list-inside">
            <li>Check your spam or promotions folder</li>
            <li>Make sure the email address is correct</li>
            <li>Wait a few minutes</li>
          </ul>
          {!sent ? (
            <Button
              variant="outline"
              fullWidth
              loading={loading}
              onClick={resend}
              disabled={!email}
              leadingIcon={<RefreshCw size={14} />}
            >
              Resend verification email
            </Button>
          ) : (
            <p className="text-xs text-state-success font-medium text-center">
              ✓ Email resent! Check your inbox.
            </p>
          )}
        </div>

        <p className="mt-6 text-xs text-ink-muted">
          Already verified?{' '}
          <Link to="/login" className="text-ink font-semibold underline underline-offset-4">
            Sign in now
          </Link>
        </p>
      </div>
    </div>
  )
}
