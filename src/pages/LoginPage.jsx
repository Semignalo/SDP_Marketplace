import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/useAuthStore'
import { extractErrorMessage, api } from '../lib/api'
import { Button, Card, Input } from '../components/ui'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [unverifiedEmail, setUnverifiedEmail] = useState('')

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: undefined }))
    setGeneralError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')

    const localErrors = {}
    if (!form.email) localErrors.email = 'Email is required'
    if (!form.password) localErrors.password = 'Password is required'
    if (Object.keys(localErrors).length) {
      setErrors(localErrors)
      return
    }

    try {
      const user = await login(form.email, form.password)
      toast.success('Signed in')
      const fallback = user?.role === 'vendor_admin' ? '/vendor'
        : user?.role === 'admin' ? '/admin'
        : '/'
      navigate(searchParams.get('next') || fallback)
    } catch (err) {
      const data = err.response?.data
      if (err.response?.status === 403 && data?.unverified) {
        setUnverifiedEmail(data.email || form.email)
        setGeneralError(data.message)
      } else {
        setGeneralError(extractErrorMessage(err, "Couldn't sign in. Try again."))
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-paper-soft px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link to="/" className="inline-block text-2xl font-bold tracking-logo text-ink">SDP</Link>
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-ink">Welcome back.</h1>
          <p className="text-sm text-ink-muted mt-2">
            New here?{' '}
            <Link to="/register" className="text-ink font-semibold underline underline-offset-4">
              Create a free account
            </Link>
          </p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="email@example.com"
              error={errors.email}
              autoComplete="email"
            />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-ink">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-ink-muted hover:text-ink underline underline-offset-4">
                  Forgot password?
                </Link>
              </div>
              <Input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                error={errors.password}
                autoComplete="current-password"
                trailingIcon={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="hover:text-ink"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>

            {generalError && (
              <div className="text-xs text-state-danger bg-state-danger/5 border border-state-danger/20 rounded px-3 py-2 space-y-2">
                <p>{generalError}</p>
                {unverifiedEmail && (
                  <button
                    type="button"
                    className="underline underline-offset-4 font-semibold hover:opacity-80"
                    onClick={async () => {
                      try {
                        await api.post('/auth/email/resend', { email: unverifiedEmail })
                        toast.success('Verification email resent!')
                      } catch {
                        toast.error("Couldn't resend it. Try again.")
                      }
                    }}
                  >
                    Resend verification →
                  </button>
                )}
              </div>
            )}

            <Button type="submit" fullWidth loading={isLoading} size="lg">
              Sign in
            </Button>
          </form>

        </Card>
      </div>
    </div>
  )
}
