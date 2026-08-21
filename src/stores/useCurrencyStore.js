import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Region + currency yang dipakai untuk MENAMPILKAN harga.
 *
 * Penagihan selalu IDR (Midtrans) — currency di sini murni tampilan, kecuali
 * `country` yang juga dikirim ke API produk supaya harga regional yang benar ikut termuat.
 *
 * `source` membedakan pilihan otomatis dari IP ('auto') dan pilihan manual user
 * ('manual'). Pilihan manual tidak boleh ditimpa geo-detect di kunjungan berikutnya.
 */
export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      country: null,
      currency: 'IDR',
      locale: 'id-ID',
      source: null,

      /** Dipakai region switcher & popup — menandai pilihan sebagai final milik user. */
      setRegion({ country, currency, locale }) {
        set({ country, currency, locale, source: 'manual' })
      },

      /** Hasil geo-detect — sengaja tidak menimpa kalau user sudah memilih manual. */
      applyDetected({ country, currency, locale }) {
        if (get().source === 'manual') return
        set({ country, currency, locale, source: 'auto' })
      },
    }),
    {
      name: 'sdp-currency',
      version: 2,
      /*
       * v1 cuma menyimpan { currency: 'IDR' | 'USD' }. Pilihan USD lama tetap dihormati
       * dan diperlakukan sebagai pilihan manual; sisanya dibiarkan kosong supaya
       * geo-detect yang menentukan.
       */
      migrate: (persisted, version) => {
        if (version >= 2) return persisted
        const oldCurrency = persisted?.currency
        return oldCurrency === 'USD'
          ? { country: null, currency: 'USD', locale: 'en-US', source: 'manual' }
          : { country: null, currency: 'IDR', locale: 'id-ID', source: null }
      },
    },
  ),
)
