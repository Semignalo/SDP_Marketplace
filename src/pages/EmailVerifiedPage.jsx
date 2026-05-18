import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '../components/ui'

const states = {
  success: {
    icon: <CheckCircle size={36} className="text-state-success" />,
    title: 'Email berhasil diverifikasi!',
    desc: 'Akun kamu sudah aktif. Silakan masuk untuk mulai belanja.',
    action: <Link to="/login"><Button size="lg">Masuk Sekarang</Button></Link>,
  },
  already: {
    icon: <CheckCircle size={36} className="text-state-success" />,
    title: 'Email sudah diverifikasi',
    desc: 'Akun kamu sudah aktif sebelumnya.',
    action: <Link to="/login"><Button size="lg">Masuk</Button></Link>,
  },
  expired: {
    icon: <Clock size={36} className="text-ink-muted" />,
    title: 'Link kadaluarsa',
    desc: 'Link verifikasi hanya berlaku 60 menit. Minta link baru di bawah ini.',
    action: <Link to="/verify-email"><Button variant="outline" size="lg">Kirim Ulang Verifikasi</Button></Link>,
  },
  invalid: {
    icon: <XCircle size={36} className="text-state-danger" />,
    title: 'Link tidak valid',
    desc: 'Link verifikasi tidak dikenali. Coba minta link baru.',
    action: <Link to="/verify-email"><Button variant="outline" size="lg">Kirim Ulang Verifikasi</Button></Link>,
  },
}

export default function EmailVerifiedPage() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status') || 'invalid'
  const state = states[status] || states.invalid

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-paper-soft px-5 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ink/5 mb-6">
          {state.icon}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{state.title}</h1>
        <p className="text-sm text-ink-muted mt-3 leading-relaxed">{state.desc}</p>
        <div className="mt-8">{state.action}</div>
        <Link to="/" className="block mt-4 text-xs text-ink-muted hover:text-ink">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
