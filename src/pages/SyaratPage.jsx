import { Link } from 'react-router-dom'

export default function SyaratPage() {
  return (
    <div className="container-page py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Terms &amp; Conditions</h1>
      <p className="mt-1 eyebrow">Last updated: May 2026</p>

      <div className="mt-8 space-y-8 text-sm text-ink-muted leading-relaxed">
        <Section title="1. Acceptance of Terms">
          By accessing or using SDP Marketplace ("the platform"), you agree to these terms
          and conditions. If you do not agree, please discontinue use of the platform.
        </Section>

        <Section title="2. User Accounts">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>You must be at least 17 years old, or have parental/guardian consent, to use the platform.</li>
            <li>Each person may only hold one active account.</li>
            <li>You are responsible for keeping your password confidential and for all activity on your account.</li>
            <li>We reserve the right to suspend accounts that violate these terms without prior notice.</li>
          </ul>
        </Section>

        <Section title="3. Orders and Payment">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>An order is considered valid once payment is successfully confirmed by the system.</li>
            <li>Product prices may change at any time without prior notice.</li>
            <li>Payments are processed by Midtrans. We do not store your payment data.</li>
            <li>Paid orders cannot be cancelled except in cases of product damage or discrepancy.</li>
          </ul>
        </Section>

        <Section title="4. Shipping">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>Estimated delivery time depends on the courier chosen and logistics conditions.</li>
            <li>Risk of loss or damage during transit is the courier's responsibility.</li>
            <li>Please ensure your shipping address is accurate. We are not responsible for delays caused by incorrect addresses.</li>
          </ul>
        </Section>

        <Section title="5. Referral Program and Commissions">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>Every user receives a unique referral code that can be shared.</li>
            <li>Commissions are calculated based on the rate in effect when the order was placed.</li>
            <li>Commissions can only be withdrawn once the related order reaches "Completed" status.</li>
            <li>We reserve the right to freeze or cancel commissions obtained through fraudulent means or system abuse.</li>
            <li>Commission withdrawals are processed within 1–3 business days after admin approval.</li>
          </ul>
        </Section>

        <Section title="6. Content and Products">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>Product descriptions, photos, and specifications are each vendor's own responsibility.</li>
            <li>We strive to ensure accurate information but do not guarantee it is free of errors.</li>
            <li>Products that are illegal, dangerous, or misleading are not permitted on the platform.</li>
          </ul>
        </Section>

        <Section title="7. Limitation of Liability">
          The platform is not liable for indirect losses, lost profits, or data loss arising
          from the use of this service. Our maximum liability is limited to the value of the
          relevant transaction.
        </Section>

        <Section title="8. Governing Law">
          These Terms & Conditions are governed by the laws of the Republic of Indonesia. Any
          disputes will be resolved through amicable consultation, and if unresolved, through
          the competent District Court.
        </Section>

        <Section title="9. Changes to Terms">
          We reserve the right to change these terms at any time. Changes take effect once
          published on the platform. Continued use of the platform after changes constitutes
          acceptance.
        </Section>

        <Section title="10. Contact">
          Questions about these terms & conditions can be sent via our{' '}
          <Link to="/kontak" className="text-ink underline">Contact page</Link>.
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-ink mb-2">{title}</h2>
      <div className="text-ink-muted">{children}</div>
    </div>
  )
}
