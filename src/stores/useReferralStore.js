import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const TTL_DAYS = 30

export const useReferralStore = create(
  persist(
    (set, get) => ({
      code: null,
      savedAt: null,

      set(code) {
        set({ code: String(code).toUpperCase().trim(), savedAt: Date.now() })
      },

      clear() {
        set({ code: null, savedAt: null })
      },

      getActive() {
        const { code, savedAt } = get()
        if (!code || !savedAt) return null
        const expiry = savedAt + TTL_DAYS * 24 * 60 * 60 * 1000
        if (Date.now() > expiry) {
          set({ code: null, savedAt: null })
          return null
        }
        return code
      },
    }),
    {
      name: 'sdp-referral',
    },
  ),
)
