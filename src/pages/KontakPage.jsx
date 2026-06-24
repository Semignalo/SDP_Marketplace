import { Link } from 'react-router-dom'
import { MessageCircle, Mail, Clock } from 'lucide-react'
import { usePublicSettings } from '../hooks/useProducts'
import { Button } from '../components/ui'

export default function KontakPage() {
  const { data: settings } = usePublicSettings()

  const waNumber = settings?.whatsapp_cs?.replace(/\D/g, '') || ''
  const waLink = waNumber ? `https://wa.me/${waNumber}` : null
  const emailCs = settings?.email_cs || null

  return (
    <div className="container-page py-12 max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Kontak Kami</h1>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          Ada pertanyaan, kendala pesanan, atau ingin bekerja sama? Tim kami siap membantu.
        </p>
      </div>

      <div className="space-y-4">
        {waLink && (
          <ContactCard
            icon={<MessageCircle size={20} />}
            title="WhatsApp"
            description={`+${waNumber}`}
            action={
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <Button size="sm">Chat Sekarang</Button>
              </a>
            }
          />
        )}

        {emailCs && (
          <ContactCard
            icon={<Mail size={20} />}
            title="Email"
            description={emailCs}
            action={
              <a href={`mailto:${emailCs}`}>
                <Button variant="outline" size="sm">Kirim Email</Button>
              </a>
            }
          />
        )}

        <ContactCard
          icon={<Clock size={20} />}
          title="Jam Operasional"
          description="Senin – Sabtu, pukul 09.00 – 17.00 WIB"
        />
      </div>

      <p className="text-xs text-ink-muted border-t border-line pt-6">
        Untuk pertanyaan umum tentang produk, pengiriman, atau pembayaran — silakan baca
        {' '}<Link to="/bantuan" className="underline hover:text-ink">Pusat Bantuan</Link> kami terlebih dahulu.
      </p>
    </div>
  )
}

function ContactCard({ icon, title, description, action }) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-xl border border-line bg-paper">
      <div className="h-10 w-10 rounded-lg bg-paper-warm border border-line flex items-center justify-center text-ink-soft shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="eyebrow">{title}</p>
        <p className="text-sm text-ink mt-0.5">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
