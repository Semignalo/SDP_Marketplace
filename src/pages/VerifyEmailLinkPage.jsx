import { useEffect, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

// Tujuan klik link verifikasi dari email. Memanggil API di belakang layar
// lalu redirect client-side ke /email-verified?status=... — browser tidak
// pernah navigasi langsung ke domain API mentah.
export default function VerifyEmailLinkPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState(null)
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const id = searchParams.get('id')
    const hash = searchParams.get('hash')
    const expires = searchParams.get('expires')
    const signature = searchParams.get('signature')

    if (!id || !hash || !expires || !signature) {
      setStatus('invalid')
      return
    }

    api.get(`/auth/email/verify/${id}/${hash}`, { params: { expires, signature } })
      .then((res) => setStatus(res.data?.status || 'invalid'))
      .catch(() => setStatus('invalid'))
  }, [searchParams])

  if (!status) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-paper-soft px-5 py-16">
        <p className="text-sm text-ink-muted">Verifying your email...</p>
      </div>
    )
  }

  return <Navigate to={`/email-verified?status=${status}`} replace />
}
