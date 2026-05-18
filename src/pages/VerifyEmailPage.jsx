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
      toast.success('Email verifikasi dikirim ulang!')
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim ulang email.'
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
        <h1 className="text-2xl font-bold tracking-tight text-ink">Cek email kamu</h1>
        <p className="text-sm text-ink-muted mt-3 leading-relaxed">
          Kami mengirim link verifikasi ke{' '}
          <strong className="text-ink">{email || 'email kamu'}</strong>.
          Klik link tersebut untuk mengaktifkan akun.
        </p>

        <div className="mt-8 bg-paper border border-line rounded-lg p-6 space-y-4 text-left">
          <p className="text-xs text-ink-muted">Tidak dapat email?</p>
          <ul className="text-xs text-ink-soft space-y-1.5 list-disc list-inside">
            <li>Cek folder spam atau promosi</li>
            <li>Pastikan alamat email sudah benar</li>
            <li>Tunggu beberapa menit</li>
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
              Kirim ulang email verifikasi
            </Button>
          ) : (
            <p className="text-xs text-state-success font-medium text-center">
              ✓ Email dikirim ulang! Cek inbox kamu.
            </p>
          )}
        </div>

        <p className="mt-6 text-xs text-ink-muted">
          Sudah verifikasi?{' '}
          <Link to="/login" className="text-ink font-semibold underline underline-offset-4">
            Masuk sekarang
          </Link>
        </p>
      </div>
    </div>
  )
}
