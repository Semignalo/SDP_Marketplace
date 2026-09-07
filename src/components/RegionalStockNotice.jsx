import { MessageCircle } from 'lucide-react'
import { usePublicSettings } from '../hooks/useProducts'

/**
 * Muncul di product page kalau produk PUNYA alokasi stok khusus untuk negara customer
 * tapi alokasinya habis (purchasable_qty === 0) — beda dari "sold out" global biasa.
 * CTA WhatsApp reuse mekanisme yang sama dengan SupportFab (settings.whatsapp_cs),
 * bukan kontak vendor spesifik.
 */
export default function RegionalStockNotice({ product }) {
  const { data: settings } = usePublicSettings()
  const waNumber = settings?.whatsapp_cs?.replace(/\D/g, '') || ''
  const text = encodeURIComponent(
    `Hi, I'd like to pre-order "${product.name}" — it shows as not available for delivery to my country.`,
  )

  return (
    <div className="mt-3 flex items-start gap-2 rounded border border-line bg-paper-warm px-3 py-2.5">
      <p className="text-2xs leading-relaxed text-ink-soft">
        This product isn't currently stocked for delivery to your country.
        {waNumber && (
          <>
            {' '}
            <a
              href={`https://wa.me/${waNumber}?text=${text}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-ink hover:underline"
            >
              <MessageCircle size={12} /> Contact us on WhatsApp for pre-order
            </a>
          </>
        )}
      </p>
    </div>
  )
}
