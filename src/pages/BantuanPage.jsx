import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'

const FAQS = [
  {
    q: 'How do I place an order?',
    a: 'Pick the product you want, add it to your cart, then click "Checkout". Fill in your shipping address, choose a courier, and complete payment via Midtrans.',
  },
  {
    q: 'What payment methods are available?',
    a: 'We support several methods via Midtrans: bank transfer / virtual account (BCA, BNI, BRI, Mandiri), QRIS, GoPay, OVO, and credit/debit cards.',
  },
  {
    q: 'How long does shipping take?',
    a: 'It depends on the courier you choose. JNE REG 2–3 days, JNE YES 1 day, J&T EZ 2–3 days, SiCepat REG 2–3 days. Estimates don\'t include national holidays.',
  },
  {
    q: 'Is free shipping available?',
    a: 'Yes! Free shipping applies to any order with a subtotal of at least Rp 150,000 (before shipping). This threshold may change at any time per marketplace policy.',
  },
  {
    q: 'How do I cancel an order?',
    a: 'Orders can only be cancelled while the status is still "Awaiting Payment". Open the order detail page under Account → My Orders, then click "Cancel Order". Once paid, an order can no longer be cancelled.',
  },
  {
    q: 'What is the referral program?',
    a: "Every account gets a unique referral code. Share your referral link with others. Whenever they shop, you earn a commission based on the current rate. Commissions can be withdrawn to your bank account once the order is completed.",
  },
  {
    q: 'How do I withdraw my commission?',
    a: 'Go to Account → Commission & Referrals, then click "Withdraw Commission". Fill in the amount and your bank details. The admin will process it within 1–3 business days.',
  },
  {
    q: 'What is Tier Loyalty?',
    a: 'The more you shop, the higher your tier and the bigger the discount you get. Tiers are calculated from your total spending on completed orders.',
  },
  {
    q: 'My product is wrong or damaged, what do I do?',
    a: 'Contact us via WhatsApp or customer service email within 48 hours of receiving the item. Include photos of the product and your order number. We\'ll follow up with the relevant vendor.',
  },
  {
    q: 'How do I register my shop/brand?',
    a: 'SDP uses an invite-only model for vendors. Contact our team via the Contact page for more information about partnerships.',
  },
]

export default function BantuanPage() {
  return (
    <div className="container-page py-12 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Help Center</h1>
        <p className="mt-2 text-sm text-ink-muted">Frequently asked questions.</p>
      </div>

      <div className="space-y-2">
        {FAQS.map((item, i) => (
          <FaqItem key={i} question={item.q} answer={item.a} />
        ))}
      </div>

      <div className="rounded-xl border border-line bg-paper-warm p-6 text-sm text-ink-muted">
        Can't find the answer you're looking for?{' '}
        <Link to="/kontak" className="text-ink font-medium underline hover:no-underline">
          Contact us directly
        </Link>
        .
      </div>
    </div>
  )
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-line rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-ink hover:bg-paper-warm transition"
      >
        <span>{question}</span>
        <ChevronDown
          size={16}
          className={`text-ink-faint shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-ink-muted leading-relaxed border-t border-line bg-paper">
          {answer}
        </div>
      )}
    </div>
  )
}
