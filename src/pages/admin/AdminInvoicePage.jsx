import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAdminOrderInvoice } from '../../hooks/useAdmin'
import { usePublicSettings } from '../../hooks/useProducts'
import InvoiceDocument from '../../components/InvoiceDocument'

export default function AdminInvoicePage() {
  const { orderNumber } = useParams()
  const { data: order, isLoading } = useAdminOrderInvoice(orderNumber)
  const { data: settings } = usePublicSettings()

  useEffect(() => {
    if (order && settings) {
      const t = setTimeout(() => window.print(), 600)
      return () => clearTimeout(t)
    }
  }, [order, settings])

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-ink-muted">
        Menyiapkan invoice...
      </div>
    )
  }

  return <InvoiceDocument order={order} settings={settings} backHref={`/admin/pesanan/${orderNumber}`} />
}
