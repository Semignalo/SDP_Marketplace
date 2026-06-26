import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { api, extractErrorMessage } from '../lib/api'
import { Button, Card, Input } from '../components/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('Email is required')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't send the reset link. Try again."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-paper-soft px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link to="/" className="inline-block text-2xl font-bold tracking-logo text-ink">SDP</Link>
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-ink">Forgot your password?</h1>
          <p className="text-sm text-ink-muted mt-2">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <Card padding="lg">
          {sent ? (
            <div className="text-center space-y-3 py-2">
              <Mail size={32} className="mx-auto text-ink-muted" />
              <p className="text-sm text-ink">
                If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox.
              </p>
              <Link to="/login" className="inline-block text-sm font-semibold text-ink underline underline-offset-4">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="email@example.com"
                error={error}
                autoComplete="email"
              />
              <Button type="submit" fullWidth loading={loading} size="lg">
                Send reset link
              </Button>
              <p className="text-center text-sm text-ink-muted">
                <Link to="/login" className="font-semibold text-ink underline underline-offset-4">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
