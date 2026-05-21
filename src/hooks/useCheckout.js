import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useCheckoutOptions() {
  return useQuery({
    queryKey: ['checkout', 'options'],
    queryFn: async () => {
      const { data } = await api.get('/checkout/options')
      return data.data
    },
    staleTime: 5 * 60_000,
  })
}

export function useShippingRates() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/checkout/shipping-rates', payload)
      return data.data
    },
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/orders', payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useSnapToken() {
  return useMutation({
    mutationFn: async (orderNumber) => {
      const { data } = await api.post(`/orders/${orderNumber}/snap-token`)
      return data.data
    },
  })
}

export function useConfirmPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (orderNumber) => {
      const { data } = await api.post(`/orders/${orderNumber}/confirm-payment`)
      return data
    },
    onSuccess: (_, orderNumber) => {
      qc.invalidateQueries({ queryKey: ['order', orderNumber] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (orderNumber) => {
      const { data } = await api.post(`/orders/${orderNumber}/cancel`)
      return data
    },
    onSuccess: (_, orderNumber) => {
      qc.invalidateQueries({ queryKey: ['order', orderNumber] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
