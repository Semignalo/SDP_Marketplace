import { Link } from 'react-router-dom'
import { formatRupiah, formatDateTime } from '../lib/utils'

const STATUS_LABEL = {
  pending_payment: 'Awaiting Payment',
  processing: 'Paid',
  shipped: 'Paid',
  completed: 'Paid',
  cancelled: 'Cancelled',
}

export default function InvoiceDocument({ order, settings, backHref, backLabel = '← Back' }) {
  const siteName = settings?.site_name || 'SDP Marketplace'
  const bankName = settings?.bank_name || ''
  const bankNumber = settings?.bank_account_number || ''
  const bankHolder = settings?.bank_account_name || ''

  const subtotalBeforeDiscount = Number(order.subtotal) + Number(order.tier_discount || 0)
  const isPaid = ['processing', 'shipped', 'completed'].includes(order.status)

  return (
    <>
      {/* Print trigger button — hanya tampil di layar, hilang saat print */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-ink text-white text-sm px-4 py-2 rounded shadow-card hover:bg-ink-soft transition"
        >
          Download / Print PDF
        </button>
        {backHref && (
          <Link
            to={backHref}
            className="bg-paper border border-line text-ink text-sm px-4 py-2 rounded shadow-card hover:bg-paper-soft transition"
          >
            {backLabel}
          </Link>
        )}
      </div>

      {/* Invoice */}
      <div className="invoice-page">
        {/* Header */}
        <div className="invoice-header">
          <div>
            <div className="brand-name">{siteName}</div>
            <div className="brand-tagline">{settings?.site_tagline || 'Multi-Brand Marketplace'}</div>
          </div>
          <div className="invoice-title-block">
            <div className="invoice-label">INVOICE</div>
            <div className="invoice-number">#{order.order_number}</div>
            <div className="invoice-meta">Date: {formatDateTime(order.created_at)}</div>
          </div>
        </div>

        <div className="divider" />

        {/* Bill to + Status */}
        <div className="info-row">
          <div className="info-block">
            <div className="info-label">BILL TO</div>
            <div className="info-value-lg">{order.shipping_name}</div>
            <div className="info-value">{order.shipping_phone}</div>
            <div className="info-value" style={{ marginTop: 4 }}>{order.shipping_address}</div>
          </div>
          <div className="info-block text-right">
            <div className="info-label">PAYMENT STATUS</div>
            <div className={`status-badge ${isPaid ? 'paid' : 'unpaid'}`}>
              {STATUS_LABEL[order.status] || order.status}
            </div>
            <div className="info-label" style={{ marginTop: 16 }}>COURIER</div>
            <div className="info-value">{order.shipping_courier || '—'}</div>
            {order.tracking_number && (
              <div className="info-value text-muted">Tracking: {order.tracking_number}</div>
            )}
          </div>
        </div>

        <div className="divider" />

        {/* Items table */}
        <table className="items-table">
          <thead>
            <tr>
              <th className="text-left">Product</th>
              <th className="text-left">Brand</th>
              <th className="text-right">Unit Price</th>
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
                <span>{order.tier_name || ''} Tier Discount</span>
                <span className="tabular">−{formatRupiah(order.tier_discount)}</span>
              </div>
            )}
            <div className="total-row">
              <span>Shipping</span>
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
              <div className="info-label">PAYMENT INSTRUCTIONS</div>
              <div style={{ marginTop: 8 }}>
                Transfer to the following account:
                <span className="bank-detail"> {bankName} {bankNumber}</span>
                {bankHolder && <span className="text-muted"> a/n {bankHolder}</span>}
              </div>
              <div className="text-muted" style={{ marginTop: 4, fontSize: 11 }}>
                Please make sure the transfer amount matches the total above.
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="invoice-footer">
          <div className="footer-thankyou">Thank you for shopping at {siteName}!</div>
          <div className="footer-note">
            This document was generated automatically on {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #f5f5f5; font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif; }

        .no-print { display: flex; }

        .invoice-page {
          background: #ffffff;
          max-width: 794px;
          margin: 48px auto;
          padding: 60px 64px;
          box-shadow: 0 2px 6px rgba(0,0,0,.06), 0 10px 24px rgba(0,0,0,.06);
          border-radius: 4px;
          color: #1a1a1a;
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
          color: #1a1a1a;
        }
        .brand-tagline {
          font-size: 11px;
          color: #6b6b6b;
          margin-top: 4px;
          letter-spacing: 0.5px;
        }
        .invoice-title-block { text-align: right; }
        .invoice-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          color: #6b6b6b;
        }
        .invoice-number {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin-top: 4px;
          letter-spacing: -0.5px;
        }
        .invoice-meta {
          font-size: 12px;
          color: #6b6b6b;
          margin-top: 4px;
        }

        /* Divider */
        .divider {
          border: none;
          border-top: 1px solid #e5e5e5;
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
          color: #a3a3a3;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .info-value-lg {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .info-value {
          font-size: 12px;
          color: #333333;
          margin-top: 2px;
          line-height: 1.5;
        }
        .text-muted { color: #6b6b6b; }

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
        .status-badge.paid { background: rgba(21,128,61,0.1); color: #15803d; }
        .status-badge.unpaid { background: rgba(161,98,7,0.1); color: #a16207; }

        /* Items table */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .items-table thead tr {
          border-bottom: 2px solid #1a1a1a;
        }
        .items-table th {
          padding: 8px 10px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #6b6b6b;
        }
        .items-table th:first-child, .items-table td:first-child { padding-left: 0; }
        .items-table th:last-child, .items-table td:last-child { padding-right: 0; }
        .items-table td {
          padding: 12px 10px;
          vertical-align: top;
          border-bottom: 1px solid #e5e5e5;
        }
        .items-table .row-even td { background: #fafafa; }
        .product-name { font-weight: 500; color: #1a1a1a; }
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
          color: #333333;
          border-bottom: 1px solid #e5e5e5;
        }
        .total-row.discount { color: #15803d; }
        .total-row.grand-total {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          border-bottom: 2px solid #1a1a1a;
          border-top: 2px solid #1a1a1a;
          padding: 10px 0;
          margin-top: 4px;
        }

        /* Payment info */
        .payment-info {
          font-size: 13px;
          color: #333333;
          background: #fafafa;
          border: 1px solid #e5e5e5;
          border-radius: 4px;
          padding: 16px 20px;
        }
        .bank-detail { font-weight: 700; color: #1a1a1a; }

        /* Footer */
        .invoice-footer {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid #e5e5e5;
          text-align: center;
        }
        .footer-thankyou {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .footer-note {
          font-size: 11px;
          color: #a3a3a3;
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
