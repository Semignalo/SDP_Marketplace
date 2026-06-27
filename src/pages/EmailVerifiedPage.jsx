import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '../components/ui'

const states = {
  success: {
    icon: <CheckCircle size={36} className="text-state-success" />,
    title: 'Email verified!',
    desc: 'Your account is now active. Sign in to start shopping.',
    action: <Link to="/login"><Button size="lg">Sign In Now</Button></Link>,
  },
  already: {
    icon: <CheckCircle size={36} className="text-state-success" />,
    title: 'Email already verified',
    desc: 'Your account was already active.',
    action: <Link to="/login"><Button size="lg">Sign In</Button></Link>,
  },
  expired: {
    icon: <Clock size={36} className="text-ink-muted" />,
    title: 'Link expired',
    desc: 'Verification links are only valid for 60 minutes. Request a new one below.',
    action: <Link to="/verify-email"><Button variant="outline" size="lg">Resend Verification</Button></Link>,
  },
  invalid: {
    icon: <XCircle size={36} className="text-state-danger" />,
    title: 'Invalid link',
    desc: "This verification link isn't recognized. Try requesting a new one.",
    action: <Link to="/verify-email"><Button variant="outline" size="lg">Resend Verification</Button></Link>,
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
          Back to Home
        </Link>
      </div>
    </div>
  )
}
