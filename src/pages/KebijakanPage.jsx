import { Link } from 'react-router-dom'

export default function KebijakanPage() {
  return (
    <div className="container-page py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Privacy Policy</h1>
      <p className="mt-1 eyebrow">Last updated: May 2026</p>

      <div className="mt-8 space-y-8 text-sm text-ink-muted leading-relaxed">
        <Section title="1. Introduction">
          SDP Marketplace ("we", "the platform") is committed to protecting user privacy in
          accordance with Indonesian Law No. 27 of 2022 on Personal Data Protection (UU PDP).
          This policy explains what data we collect, how we use it, and your rights over that
          data.
        </Section>

        <Section title="2. Data We Collect">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li><strong>Identity data:</strong> name, email address, phone number.</li>
            <li><strong>Transaction data:</strong> order history, products purchased, shipping address.</li>
            <li><strong>Payment data:</strong> processed entirely by Midtrans. We do not store your card or bank account details.</li>
            <li><strong>Usage data:</strong> pages visited, products viewed, wishlist.</li>
            <li><strong>Referral data:</strong> your referral code and downline network.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>Processing and managing your orders.</li>
            <li>Sending order-related notifications via email.</li>
            <li>Calculating and paying referral commissions.</li>
            <li>Improving our service and shopping experience.</li>
            <li>Complying with applicable legal obligations.</li>
          </ul>
        </Section>

        <Section title="4. Sharing Data with Third Parties">
          We only share data under the following circumstances:
          <ul className="list-disc list-outside pl-5 mt-2 space-y-1.5">
            <li><strong>Vendors:</strong> recipient name, address, and phone number are passed to vendors for shipping purposes.</li>
            <li><strong>Midtrans:</strong> transaction data for payment processing.</li>
            <li><strong>Couriers:</strong> recipient name and address for package delivery.</li>
            <li><strong>Authorities:</strong> when required by law or court order.</li>
          </ul>
          We do not sell your personal data to third parties for marketing purposes.
        </Section>

        <Section title="5. Data Security">
          We use HTTPS encryption, password hashing (bcrypt), and role-based access control to
          protect your data. That said, no system is 100% secure — please keep your account
          credentials confidential.
        </Section>

        <Section title="6. Data Retention">
          Account data is kept while your account is active. Transaction and financial data is
          retained for at least 5 years to meet tax and audit requirements. You may request
          account deletion via the Contact page.
        </Section>

        <Section title="7. Your Rights (UU PDP)">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>Access the personal data we hold about you.</li>
            <li>Update or correct inaccurate data.</li>
            <li>Request deletion of your data (subject to certain conditions).</li>
            <li>Object to certain data processing.</li>
          </ul>
          To exercise any of the rights above, contact us via the{' '}
          <Link to="/kontak" className="text-ink underline">Contact page</Link>.
        </Section>

        <Section title="8. Cookies">
          We use localStorage to store session tokens and user preferences (e.g. cart state).
          We do not use third-party cookies for ad tracking.
        </Section>

        <Section title="9. Changes to This Policy">
          This policy may be updated from time to time. Material changes will be communicated
          via email or an in-platform notification. Continued use of the platform after changes
          take effect constitutes acceptance.
        </Section>

        <Section title="10. Contact">
          Questions about this privacy policy can be sent to our{' '}
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
