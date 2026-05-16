import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, setToken } from '../lib/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isReady: false,

      async login(email, password) {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          setToken(data.token)
          set({ user: data.user })
          return data.user
        } finally {
          set({ isLoading: false })
        }
      },

      async register(payload) {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', payload)
          setToken(data.token)
          set({ user: data.user })
          return data.user
        } finally {
          set({ isLoading: false })
        }
      },

      async logout() {
        try {
          await api.post('/auth/logout')
        } catch {
          // ignore — clear local state regardless
        }
        setToken(null)
        set({ user: null })
      },

      async fetchMe() {
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.user, isReady: true })
          return data.user
        } catch {
          setToken(null)
          set({ user: null, isReady: true })
          return null
        }
      },

      setReady(v = true) {
        set({ isReady: v })
      },

      hasRole(role) {
        return get().user?.role === role
      },
    }),
    {
      name: 'sdp-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
