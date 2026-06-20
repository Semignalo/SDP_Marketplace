import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

// Validasi kode referral (public). Dipakai field referral di checkout.
export function useValidateReferral() {
  return useMutation({
    mutationFn: async (code) => {
      const { data } = await api.get('/referral/validate', { params: { code } })
      return data.data
    },
  })
}

export function useGuestShippingRates() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/guest/shipping-rates', payload)
      return data.data
    },
  })
}

export function useCreateGuestOrder() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/guest/orders', payload)
      // { data: OrderResource, guest_token }
      return data
    },
  })
}

export function useGuestSnapToken() {
  return useMutation({
    mutationFn: async ({ orderNumber, token }) => {
      const { data } = await api.post(
        `/guest/orders/${orderNumber}/snap-token`,
        {},
        { params: { token } },
      )
      return data.data
    },
  })
}

export function useResendGuestTrackingLink() {
  return useMutation({
    mutationFn: async ({ orderNumber, guestEmail }) => {
      const { data } = await api.post('/guest/orders/resend-link', {
        order_number: orderNumber,
        guest_email: guestEmail,
      })
      return data
    },
  })
}

export function useGuestOrder(orderNumber, token) {
  return useQuery({
    queryKey: ['guest-order', orderNumber, token],
    enabled: !!orderNumber && !!token,
    queryFn: async () => {
      const { data } = await api.get(`/guest/orders/${orderNumber}`, { params: { token } })
      return data.data
    },
  })
}
