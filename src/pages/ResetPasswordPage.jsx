import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { api, extractErrorMessage } from '../lib/api'
import { Button, Card, Input } from '../components/ui'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({ password: '', password_confirmation: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: undefined }))
    setGeneralError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')

    if (!email || !token) {
      setGeneralError('This reset link is invalid. Request a new one.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email, token, ...form })
      toast.success('Password updated — sign in with your new password')
      navigate('/login')
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        const map = {}
        Object.entries(apiErrors).forEach(([k, v]) => (map[k] = Array.isArray(v) ? v[0] : v))
        setErrors(map)
      } else {
        setGeneralError(extractErrorMessage(err, "Couldn't reset your password. Try again."))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-paper-soft px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link to="/" className="inline-block text-2xl font-bold tracking-logo text-ink">SDP</Link>
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-ink">Set a new password</h1>
          <p className="text-sm text-ink-muted mt-2">for {email || 'your account'}</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="New password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
              placeholder="••••••••"
              error={errors.password}
              autoComplete="new-password"
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
            <Input
              label="Confirm new password"
              type={showPass ? 'text' : 'password'}
              value={form.password_confirmation}
              onChange={update('password_confirmation')}
              placeholder="••••••••"
              error={errors.password_confirmation}
              autoComplete="new-password"
            />

            {generalError && (
              <div className="text-xs text-state-danger bg-state-danger/5 border border-state-danger/20 rounded px-3 py-2 space-y-2">
                <p>{generalError}</p>
                <Link to="/forgot-password" className="underline underline-offset-4 font-semibold hover:opacity-80">
                  Request a new link →
                </Link>
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg">
              Reset password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
