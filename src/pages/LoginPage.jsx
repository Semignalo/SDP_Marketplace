import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/useAuthStore'
import { extractErrorMessage, api } from '../lib/api'
import { Button, Input } from '../components/ui'

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
    if (!form.email) localErrors.email = 'Email wajib diisi'
    if (!form.password) localErrors.password = 'Password wajib diisi'
    if (Object.keys(localErrors).length) {
      setErrors(localErrors)
      return
    }

    try {
      const user = await login(form.email, form.password)
      toast.success('Berhasil masuk')
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
        setGeneralError(extractErrorMessage(err, 'Gagal masuk. Coba lagi.'))
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-paper-soft px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link to="/" className="inline-block text-2xl font-bold tracking-[0.2em] text-ink">SDP</Link>
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-ink">Masuk ke akun</h1>
          <p className="text-sm text-ink-muted mt-2">
            Belum punya akun?{' '}
            <Link to="/register" className="text-ink font-semibold underline underline-offset-4">
              Daftar gratis
            </Link>
          </p>
        </div>

        <div className="bg-paper border border-line rounded-lg p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="email@contoh.com"
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
              placeholder="••••••••"
              error={errors.password}
              autoComplete="current-password"
              trailingIcon={
                <button type="button" onClick={() => setShowPass(!showPass)} className="hover:text-ink">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

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
                        toast.success('Email verifikasi dikirim ulang!')
                      } catch {
                        toast.error('Gagal mengirim ulang. Coba lagi.')
                      }
                    }}
                  >
                    Kirim ulang verifikasi →
                  </button>
                )}
              </div>
            )}

            <Button type="submit" fullWidth loading={isLoading} size="lg">
              Masuk
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-line text-2xs uppercase tracking-widest text-ink-muted">
            <p className="mb-2">Demo akun:</p>
            <ul className="space-y-1 text-ink-faint normal-case tracking-normal text-xs">
              <li>admin@sdp.local / password</li>
              <li>customer1@sdp.local / password</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
