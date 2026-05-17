import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useOrder } from '../../hooks/useAccount'
import { usePublicSettings } from '../../hooks/useProducts'
import { formatRupiah, formatDateTime } from '../../lib/utils'

export default function InvoicePage() {
  const { orderNumber } = useParams()
  const { data: order, isLoading } = useOrder(orderNumber)
  const { data: settings } = usePublicSettings()

  useEffect(() => {
    if (order && settings) {
      const t = setTimeout(() => window.print(), 600)
      return () => clearTimeout(t)
    }
  }, [order, settings])

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-gray-400">
        Menyiapkan invoice...
      </div>
    )
  }

  const siteName = settings?.site_name || 'SDP Marketplace'
  const bankName = settings?.bank_name || ''
  const bankNumber = settings?.bank_account_number || ''
  const bankHolder = settings?.bank_account_name || ''

  const subtotalBeforeDiscount = Number(order.subtotal) + Number(order.tier_discount || 0)
  const isPaid = ['processing', 'shipped', 'completed'].includes(order.status)

  const STATUS_LABEL = {
    pending_payment: 'Menunggu Pembayaran',
    processing: 'Lunas',
    shipped: 'Lunas',
    completed: 'Lunas',
    cancelled: 'Dibatalkan',
  }

  return (
    <>
      {/* Print trigger button — hanya tampil di layar, hilang saat print */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="bg-black text-white text-sm px-4 py-2 rounded shadow hover:bg-gray-800 transition"
        >
          Download / Print PDF
        </button>
        <Link
          to={`/akun/pesanan/${orderNumber}`}
          className="bg-white border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded shadow hover:bg-gray-50 transition"
        >
          ← Kembali
        </Link>
      </div>

      {/* Invoice */}
      <div className="invoice-page">
        {/* Header */}
        <div className="invoice-header">
          <div>
            <div className="brand-name">{siteName}</div>
            <div className="brand-tagline">{settings?.site_tagline || 'Marketplace Multi-Brand'}</div>
          </div>
          <div className="invoice-title-block">
            <div className="invoice-label">INVOICE</div>
            <div className="invoice-number">#{order.order_number}</div>
            <div className="invoice-meta">Tanggal: {formatDateTime(order.created_at)}</div>
          </div>
        </div>

        <div className="divider" />

        {/* Bill to + Status */}
        <div className="info-row">
          <div className="info-block">
            <div className="info-label">TAGIHAN KEPADA</div>
            <div className="info-value-lg">{order.shipping_name}</div>
            <div className="info-value">{order.shipping_phone}</div>
            <div className="info-value" style={{ marginTop: 4 }}>{order.shipping_address}</div>
          </div>
          <div className="info-block text-right">
            <div className="info-label">STATUS PEMBAYARAN</div>
            <div className={`status-badge ${isPaid ? 'paid' : 'unpaid'}`}>
              {STATUS_LABEL[order.status] || order.status}
            </div>
            <div className="info-label" style={{ marginTop: 16 }}>KURIR</div>
            <div className="info-value">{order.shipping_courier || '—'}</div>
            {order.tracking_number && (
              <div className="info-value text-muted">Resi: {order.tracking_number}</div>
            )}
          </div>
        </div>

        <div className="divider" />

        {/* Items table */}
        <table className="items-table">
          <thead>
            <tr>
              <th className="text-left">Produk</th>
              <th className="text-left">Brand</th>
              <th className="text-right">Harga Satuan</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? 'row-even' : ''}>
                <td className="product-name">{item.product_name}</td>
                <td className="text-muted">{item.vendor?.name || '—'}</td>
                <td className="text-right tabular">{formatRupiah(item.price)}</td>
                <td className="text-right tabular">{item.quantity}</td>
                <td className="text-right tabular font-semibold">{formatRupiah(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals-section">
          <div className="totals-box">
            <div className="total-row">
              <span>Subtotal</span>
              <span className="tabular">{formatRupiah(subtotalBeforeDiscount)}</span>
            </div>
            {order.tier_discount > 0 && (
              <div className="total-row discount">
                <span>Diskon Tier {order.tier_name || ''}</span>
                <span className="tabular">−{formatRupiah(order.tier_discount)}</span>
              </div>
            )}
            <div className="total-row">
              <span>Ongkos Kirim</span>
              <span className="tabular">{formatRupiah(order.shipping_cost)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span className="tabular">{formatRupiah(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment info (jika belum lunas) */}
        {!isPaid && bankNumber && (
          <>
            <div className="divider" />
            <div className="payment-info">
              <div className="info-label">INSTRUKSI PEMBAYARAN</div>
              <div style={{ marginTop: 8 }}>
                Transfer ke rekening berikut:
                <span className="bank-detail"> {bankName} {bankNumber}</span>
                {bankHolder && <span className="text-muted"> a.n. {bankHolder}</span>}
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>
                Pastikan nominal transfer sesuai dengan total tagihan di atas.
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="invoice-footer">
          <div className="footer-thankyou">Terima kasih telah berbelanja di {siteName}!</div>
          <div className="footer-note">
            Dokumen ini digenerate otomatis pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #f5f5f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }

        .no-print { display: flex; }

        .invoice-page {
          background: #fff;
          max-width: 794px;
          margin: 48px auto;
          padding: 60px 64px;
          box-shadow: 0 4px 40px rgba(0,0,0,0.10);
          border-radius: 4px;
          color: #111;
        }

        /* Header */
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .brand-name {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #000;
        }
        .brand-tagline {
          font-size: 11px;
          color: #888;
          margin-top: 4px;
          letter-spacing: 0.5px;
        }
        .invoice-title-block { text-align: right; }
        .invoice-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          color: #888;
        }
        .invoice-number {
          font-size: 20px;
          font-weight: 700;
          color: #000;
          margin-top: 4px;
          letter-spacing: -0.5px;
        }
        .invoice-meta {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
        }

        /* Divider */
        .divider {
          border: none;
          border-top: 1px solid #e8e8e8;
          margin: 32px 0;
        }

        /* Info row */
        .info-row {
          display: flex;
          justify-content: space-between;
          gap: 32px;
        }
        .info-block { flex: 1; }
        .text-right { text-align: right; }
        .info-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #aaa;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .info-value-lg {
          font-size: 15px;
          font-weight: 600;
          color: #000;
        }
        .info-value {
          font-size: 12px;
          color: #555;
          margin-top: 2px;
          line-height: 1.5;
        }
        .text-muted { color: #888; }

        /* Status badge */
        .status-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 100px;
          margin-top: 4px;
        }
        .status-badge.paid { background: #e6f4ea; color: #1a7a3a; }
        .status-badge.unpaid { background: #fff8e1; color: #b45309; }

        /* Items table */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .items-table thead tr {
          border-bottom: 2px solid #000;
        }
        .items-table th {
          padding: 8px 10px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #888;
        }
        .items-table th:first-child, .items-table td:first-child { padding-left: 0; }
        .items-table th:last-child, .items-table td:last-child { padding-right: 0; }
        .items-table td {
          padding: 12px 10px;
          vertical-align: top;
          border-bottom: 1px solid #f0f0f0;
        }
        .items-table .row-even td { background: #fafafa; }
        .product-name { font-weight: 500; color: #111; }
        .tabular { font-variant-numeric: tabular-nums; }
        .font-semibold { font-weight: 600; }

        /* Totals */
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 24px;
        }
        .totals-box {
          width: 280px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 6px 0;
          color: #555;
          border-bottom: 1px solid #f0f0f0;
        }
        .total-row.discount { color: #1a7a3a; }
        .total-row.grand-total {
          font-size: 16px;
          font-weight: 700;
          color: #000;
          border-bottom: 2px solid #000;
          border-top: 2px solid #000;
          padding: 10px 0;
          margin-top: 4px;
        }

        /* Payment info */
        .payment-info {
          font-size: 13px;
          color: #444;
          background: #fafafa;
          border: 1px solid #eee;
          border-radius: 4px;
          padding: 16px 20px;
        }
        .bank-detail { font-weight: 700; color: #000; }

        /* Footer */
        .invoice-footer {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid #e8e8e8;
          text-align: center;
        }
        .footer-thankyou {
          font-size: 14px;
          font-weight: 600;
          color: #000;
        }
        .footer-note {
          font-size: 11px;
          color: #aaa;
          margin-top: 6px;
        }

        /* Print styles */
        @media print {
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { background: #fff; }
          .no-print { display: none !important; }
          .invoice-page {
            max-width: 100%;
            margin: 0;
            padding: 40px 48px;
            box-shadow: none;
            border-radius: 0;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </>
  )
}
