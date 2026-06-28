import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageCircle, Mail, Instagram, X, Headset } from 'lucide-react'
import { usePublicSettings } from '../hooks/useProducts'
import { cn } from '../lib/utils'

const HIDDEN_PREFIXES = ['/admin', '/vendor']

export default function SupportFab() {
  const { pathname } = useLocation()
  const { data: settings } = usePublicSettings()
  const [open, setOpen] = useState(false)

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const waNumber = settings?.whatsapp_cs?.replace(/\D/g, '') || ''
  const channels = [
    waNumber && {
      key: 'whatsapp',
      label: 'WhatsApp',
      hint: 'Fastest for Indonesia',
      href: `https://wa.me/${waNumber}`,
      icon: <MessageCircle size={18} />,
      iconClass: 'bg-[#25D366] text-white',
    },
    settings?.email_cs && {
      key: 'email',
      label: 'Email',
      hint: 'Best for international',
      href: `mailto:${settings.email_cs}`,
      icon: <Mail size={18} />,
      iconClass: 'bg-ink text-white',
    },
    settings?.social_instagram && {
      key: 'instagram',
      label: 'Instagram DM',
      hint: '@' + settings.social_instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, ''),
      href: settings.social_instagram,
      icon: <Instagram size={18} />,
      iconClass: 'bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white',
    },
  ].filter(Boolean)

  if (channels.length === 0) return null

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="mb-1 w-60 bg-paper border border-line rounded-xl shadow-hover overflow-hidden">
          <div className="px-4 py-3 bg-paper-soft border-b border-line">
            <p className="text-sm font-semibold text-ink">Need help?</p>
            <p className="text-2xs text-ink-muted mt-0.5">Chat with our team</p>
          </div>
          <ul>
            {channels.map((c) => (
              <li key={c.key}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-paper-soft transition"
                >
                  <span className={cn('h-9 w-9 rounded-full inline-flex items-center justify-center shrink-0', c.iconClass)}>
                    {c.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{c.label}</span>
                    <span className="block text-2xs text-ink-muted truncate">{c.hint}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close support menu' : 'Contact support'}
        aria-expanded={open}
        className="h-14 w-14 rounded-full bg-ink text-white shadow-hover inline-flex items-center justify-center hover:bg-ink-soft transition active:scale-95"
      >
        {open ? <X size={22} /> : <Headset size={22} />}
      </button>
    </div>
  )
}
