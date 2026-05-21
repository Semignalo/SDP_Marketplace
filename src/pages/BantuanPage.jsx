import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'

const FAQS = [
  {
    q: 'Bagaimana cara melakukan pemesanan?',
    a: 'Pilih produk yang kamu inginkan, tambahkan ke keranjang, lalu klik "Checkout". Isi alamat pengiriman, pilih kurir, dan selesaikan pembayaran melalui Midtrans.',
  },
  {
    q: 'Metode pembayaran apa saja yang tersedia?',
    a: 'Kami mendukung berbagai metode melalui Midtrans: transfer bank virtual account (BCA, BNI, BRI, Mandiri), QRIS, GoPay, OVO, dan kartu kredit/debit.',
  },
  {
    q: 'Berapa lama proses pengiriman?',
    a: 'Tergantung kurir yang dipilih. JNE REG 2–3 hari, JNE YES 1 hari, J&T EZ 2–3 hari, SiCepat REG 2–3 hari. Estimasi belum termasuk hari libur nasional.',
  },
  {
    q: 'Apakah ada gratis ongkir?',
    a: 'Ya! Gratis ongkir untuk setiap pesanan dengan subtotal minimal Rp 150.000 (sebelum ongkir). Nilai ini dapat berubah sewaktu-waktu sesuai kebijakan marketplace.',
  },
  {
    q: 'Bagaimana cara membatalkan pesanan?',
    a: 'Pesanan hanya bisa dibatalkan selama status masih "Menunggu Pembayaran". Buka halaman detail pesanan di Akun → Pesanan Saya, lalu klik "Batalkan Pesanan". Setelah dibayar, pesanan tidak dapat dibatalkan.',
  },
  {
    q: 'Apa itu program referral?',
    a: 'Setiap akun mendapat kode referral unik. Bagikan link referralmu ke orang lain. Setiap kali mereka berbelanja, kamu mendapat komisi sesuai persentase yang berlaku. Komisi bisa ditarik ke rekening bank setelah pesanan selesai.',
  },
  {
    q: 'Bagaimana cara menarik komisi?',
    a: 'Masuk ke Akun → Komisi & Referral, lalu klik "Tarik Komisi". Isi jumlah dan data rekening bank kamu. Admin akan memproses dalam 1–3 hari kerja.',
  },
  {
    q: 'Apa itu Tier Loyalty?',
    a: 'Semakin banyak kamu berbelanja, semakin tinggi tier-mu dan semakin besar diskon yang kamu dapatkan. Tier dihitung dari total belanja pesanan yang sudah selesai (status Completed).',
  },
  {
    q: 'Produk saya tidak sesuai/rusak, bagaimana?',
    a: 'Hubungi kami via WhatsApp atau email CS dalam 2×24 jam setelah barang diterima. Sertakan foto produk dan nomor pesanan. Kami akan menindaklanjuti bersama vendor terkait.',
  },
  {
    q: 'Bagaimana cara mendaftarkan toko/brand saya?',
    a: 'SDP menggunakan model invite-only untuk vendor. Hubungi tim kami via halaman Kontak untuk informasi lebih lanjut mengenai partnership.',
  },
]

export default function BantuanPage() {
  return (
    <div className="container-page py-12 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Pusat Bantuan</h1>
        <p className="mt-2 text-sm text-ink-muted">Pertanyaan yang sering ditanyakan.</p>
      </div>

      <div className="space-y-2">
        {FAQS.map((item, i) => (
          <FaqItem key={i} question={item.q} answer={item.a} />
        ))}
      </div>

      <div className="rounded-xl border border-line bg-paper-warm p-6 text-sm text-ink-muted">
        Tidak menemukan jawaban yang kamu cari?{' '}
        <Link to="/kontak" className="text-ink font-medium underline hover:no-underline">
          Hubungi kami langsung
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
