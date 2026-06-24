import { Link } from 'react-router-dom'

export default function KebijakanPage() {
  return (
    <div className="container-page py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Kebijakan Privasi</h1>
      <p className="mt-1 eyebrow">Terakhir diperbarui: Mei 2026</p>

      <div className="mt-8 space-y-8 text-sm text-ink-muted leading-relaxed">
        <Section title="1. Pendahuluan">
          SDP Marketplace ("kami", "platform") berkomitmen melindungi privasi pengguna sesuai
          Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP).
          Kebijakan ini menjelaskan data apa yang kami kumpulkan, bagaimana kami menggunakannya,
          dan hak-hak kamu atas data tersebut.
        </Section>

        <Section title="2. Data yang Kami Kumpulkan">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li><strong>Data identitas:</strong> nama, alamat email, nomor telepon.</li>
            <li><strong>Data transaksi:</strong> riwayat pesanan, produk yang dibeli, alamat pengiriman.</li>
            <li><strong>Data pembayaran:</strong> diproses sepenuhnya oleh Midtrans. Kami tidak menyimpan data kartu atau rekening bank kamu.</li>
            <li><strong>Data penggunaan:</strong> halaman yang dikunjungi, produk yang dilihat, wishlist.</li>
            <li><strong>Data referral:</strong> kode referral dan jaringan downline kamu.</li>
          </ul>
        </Section>

        <Section title="3. Tujuan Penggunaan Data">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>Memproses dan mengelola pesanan kamu.</li>
            <li>Mengirimkan notifikasi terkait pesanan via email.</li>
            <li>Menghitung dan membayar komisi referral.</li>
            <li>Meningkatkan layanan dan pengalaman belanja.</li>
            <li>Memenuhi kewajiban hukum yang berlaku.</li>
          </ul>
        </Section>

        <Section title="4. Berbagi Data dengan Pihak Ketiga">
          Kami membagikan data hanya dalam kondisi berikut:
          <ul className="list-disc list-outside pl-5 mt-2 space-y-1.5">
            <li><strong>Vendor:</strong> nama, alamat, dan nomor telepon penerima diteruskan ke vendor untuk keperluan pengiriman.</li>
            <li><strong>Midtrans:</strong> data transaksi untuk pemrosesan pembayaran.</li>
            <li><strong>Kurir:</strong> nama dan alamat penerima untuk pengiriman paket.</li>
            <li><strong>Pihak berwenang:</strong> jika diwajibkan oleh hukum atau perintah pengadilan.</li>
          </ul>
          Kami tidak menjual data pribadimu kepada pihak ketiga untuk tujuan pemasaran.
        </Section>

        <Section title="5. Keamanan Data">
          Kami menerapkan enkripsi HTTPS, hashing password (bcrypt), dan kontrol akses berbasis peran
          untuk melindungi data kamu. Meski demikian, tidak ada sistem yang 100% aman — harap
          jaga kerahasiaan kredensial akunmu.
        </Section>

        <Section title="6. Retensi Data">
          Data akun disimpan selama akunmu aktif. Data transaksi dan keuangan disimpan minimal
          5 tahun sesuai kebutuhan perpajakan dan audit. Kamu dapat mengajukan penghapusan akun
          melalui menu Kontak.
        </Section>

        <Section title="7. Hak-Hak Kamu (UU PDP)">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>Mengakses data pribadimu yang kami simpan.</li>
            <li>Memperbarui atau mengoreksi data yang tidak akurat.</li>
            <li>Meminta penghapusan data (dengan ketentuan tertentu).</li>
            <li>Mengajukan keberatan atas pemrosesan data tertentu.</li>
          </ul>
          Untuk menggunakan hak-hak di atas, hubungi kami melalui halaman{' '}
          <Link to="/kontak" className="text-ink underline">Kontak</Link>.
        </Section>

        <Section title="8. Cookie">
          Kami menggunakan localStorage untuk menyimpan token sesi dan preferensi pengguna
          (misalnya status keranjang). Tidak ada cookie pihak ketiga untuk pelacakan iklan.
        </Section>

        <Section title="9. Perubahan Kebijakan">
          Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan material akan diberitahukan
          melalui email atau notifikasi di platform. Penggunaan platform setelah perubahan berlaku
          dianggap sebagai persetujuan.
        </Section>

        <Section title="10. Kontak">
          Pertanyaan terkait kebijakan privasi dapat dikirimkan ke{' '}
          <Link to="/kontak" className="text-ink underline">halaman Kontak kami</Link>.
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
