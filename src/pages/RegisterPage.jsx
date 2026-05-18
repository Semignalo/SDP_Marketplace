import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/useAuthStore'
import { extractErrorMessage } from '../lib/api'
import { Button, Input } from '../components/ui'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const register = useAuthStore((s) => s.register)
  const isLoading = useAuthStore((s) => s.isLoading)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    ref_code: searchParams.get('ref') || '',
  })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')

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
    if (!form.name) localErrors.name = 'Nama wajib diisi'
    if (!form.email) localErrors.email = 'Email wajib diisi'
    if (!form.password) localErrors.password = 'Password wajib diisi'
    else if (form.password.length < 8) localErrors.password = 'Minimal 8 karakter'
    if (form.password !== form.password_confirmation) {
      localErrors.password_confirmation = 'Konfirmasi password tidak cocok'
    }
    if (Object.keys(localErrors).length) {
      setErrors(localErrors)
      return
    }

    try {
      const result = await register({
        ...form,
        ref_code: form.ref_code.trim().toUpperCase() || undefined,
      })
      navigate(`/verify-email?email=${encodeURIComponent(result.email)}`)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const apiErrors = {}
        Object.entries(data.errors).forEach(([k, v]) => {
          apiErrors[k] = Array.isArray(v) ? v[0] : v
        })
        setErrors(apiErrors)
      } else {
        setGeneralError(extractErrorMessage(err, 'Gagal mendaftar.'))
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-paper-soft px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link to="/" className="inline-block text-2xl font-bold tracking-[0.2em] text-ink">SDP</Link>
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-ink">Buat akun baru</h1>
          <p className="text-sm text-ink-muted mt-2">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-ink font-semibold underline underline-offset-4">
              Masuk
            </Link>
          </p>
        </div>

        <div className="bg-paper border border-line rounded-lg p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nama Lengkap" value={form.name} onChange={update('name')} placeholder="Nama kamu" error={errors.name} />
            <Input label="Email" type="email" value={form.email} onChange={update('email')} placeholder="email@contoh.com" error={errors.email} />
            <Input label="Nomor HP (opsional)" value={form.phone} onChange={update('phone')} placeholder="+62..." error={errors.phone} />
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
              placeholder="Min. 8 karakter"
              error={errors.password}
              trailingIcon={
                <button type="button" onClick={() => setShowPass(!showPass)} className="hover:text-ink">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            <Input
              label="Konfirmasi Password"
              type={showPass ? 'text' : 'password'}
              value={form.password_confirmation}
              onChange={update('password_confirmation')}
              placeholder="Ulangi password"
              error={errors.password_confirmation}
            />

            <div>
              <Input
                label="Kode Referral (opsional)"
                value={form.ref_code}
                onChange={update('ref_code')}
                placeholder="Masukkan kode referral"
                error={errors.ref_code}
              />
              {form.ref_code && !errors.ref_code && (
                <p className="text-2xs text-state-success mt-1">✓ Kode referral akan diterapkan</p>
              )}
            </div>

            {generalError && (
              <p className="text-xs text-state-danger bg-state-danger/5 border border-state-danger/20 rounded px-3 py-2">
                {generalError}
              </p>
            )}

            <Button type="submit" fullWidth loading={isLoading} size="lg">
              Daftar Sekarang
            </Button>

            <p className="text-2xs text-ink-muted text-center leading-relaxed">
              Dengan mendaftar, kamu menyetujui Syarat & Kebijakan Privasi kami.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
