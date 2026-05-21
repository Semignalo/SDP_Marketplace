export default function SyaratPage() {
  return (
    <div className="container-page py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Syarat &amp; Ketentuan</h1>
      <p className="mt-1 text-xs text-ink-faint uppercase tracking-widest">Terakhir diperbarui: Mei 2026</p>

      <div className="mt-8 space-y-8 text-sm text-ink-muted leading-relaxed">
        <Section title="1. Penerimaan Syarat">
          Dengan mengakses atau menggunakan SDP Marketplace ("platform"), kamu menyetujui
          syarat dan ketentuan ini. Jika tidak setuju, mohon hentikan penggunaan platform.
        </Section>

        <Section title="2. Akun Pengguna">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>Kamu harus berusia minimal 17 tahun atau mendapat persetujuan orang tua/wali untuk menggunakan platform.</li>
            <li>Satu orang hanya boleh memiliki satu akun aktif.</li>
            <li>Kamu bertanggung jawab menjaga kerahasiaan password dan semua aktivitas yang terjadi di akunmu.</li>
            <li>Kami berhak menonaktifkan akun yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya.</li>
          </ul>
        </Section>

        <Section title="3. Pemesanan dan Pembayaran">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>Pesanan dianggap sah setelah pembayaran berhasil dikonfirmasi oleh sistem.</li>
            <li>Harga produk dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>
            <li>Pembayaran diproses oleh Midtrans. Kami tidak menyimpan data pembayaranmu.</li>
            <li>Pesanan yang sudah dibayar tidak dapat dibatalkan kecuali terdapat kerusakan atau ketidaksesuaian produk.</li>
          </ul>
        </Section>

        <Section title="4. Pengiriman">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>Estimasi waktu pengiriman bergantung pada kurir yang dipilih dan kondisi logistik.</li>
            <li>Risiko kehilangan atau kerusakan selama pengiriman menjadi tanggung jawab kurir.</li>
            <li>Pastikan alamat pengiriman yang kamu masukkan akurat. Kami tidak bertanggung jawab atas keterlambatan akibat kesalahan alamat.</li>
          </ul>
        </Section>

        <Section title="5. Program Referral dan Komisi">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>Setiap pengguna mendapat kode referral unik yang dapat dibagikan.</li>
            <li>Komisi dihitung berdasarkan persentase yang berlaku saat pesanan dibuat.</li>
            <li>Komisi hanya dapat dicairkan setelah pesanan terkait berstatus "Selesai".</li>
            <li>Kami berhak membekukan atau membatalkan komisi yang diperoleh melalui cara tidak sah atau penyalahgunaan sistem.</li>
            <li>Pencairan komisi diproses dalam 1–3 hari kerja setelah disetujui admin.</li>
          </ul>
        </Section>

        <Section title="6. Konten dan Produk">
          <ul className="list-disc list-outside pl-5 space-y-1.5">
            <li>Deskripsi, foto, dan spesifikasi produk merupakan tanggung jawab vendor masing-masing.</li>
            <li>Kami berusaha memastikan akurasi informasi, namun tidak menjamin ketiadaan kesalahan.</li>
            <li>Produk yang melanggar hukum, berbahaya, atau menyesatkan tidak diperkenankan di platform.</li>
          </ul>
        </Section>

        <Section title="7. Batasan Tanggung Jawab">
          Platform tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan,
          atau kerusakan data yang timbul dari penggunaan layanan ini. Tanggung jawab maksimal kami
          terbatas pada nilai transaksi yang bersangkutan.
        </Section>

        <Section title="8. Hukum yang Berlaku">
          Syarat & Ketentuan ini tunduk pada hukum Republik Indonesia. Segala sengketa
          diselesaikan melalui musyawarah mufakat, dan apabila tidak tercapai, melalui
          Pengadilan Negeri yang berwenang.
        </Section>

        <Section title="9. Perubahan Ketentuan">
          Kami berhak mengubah syarat ini kapan saja. Perubahan berlaku sejak dipublikasikan
          di platform. Penggunaan platform setelah perubahan dianggap sebagai persetujuan.
        </Section>

        <Section title="10. Kontak">
          Pertanyaan terkait syarat & ketentuan dapat dikirimkan melalui{' '}
          <a href="/kontak" className="text-ink underline">halaman Kontak kami</a>.
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
