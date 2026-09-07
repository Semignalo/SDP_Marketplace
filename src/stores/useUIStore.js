import { create } from 'zustand'

export const useUIStore = create((set) => ({
  cartOpen: false,
  mobileMenuOpen: false,
  searchOpen: false,

  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),

  openMobileMenu: () => set({ mobileMenuOpen: true }),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),

  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),

  // Hasil terakhir dari cart auto-sync saat region berubah (lihat useCartAvailability.js)
  // — dipakai CartAdjustmentNotice buat nunjukin banner persisten kalau toast kelewat.
  lastCartAdjustment: null,
  setLastCartAdjustment: (val) => set({ lastCartAdjustment: val }),
  clearLastCartAdjustment: () => set({ lastCartAdjustment: null }),
}))
