import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      currency: 'IDR',

      setCurrency(currency) {
        set({ currency })
      },

      toggle() {
        set({ currency: get().currency === 'IDR' ? 'USD' : 'IDR' })
      },
    }),
    {
      name: 'sdp-currency',
    },
  ),
)
