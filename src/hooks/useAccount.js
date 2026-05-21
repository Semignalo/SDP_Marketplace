import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useRajaOngkirCities(search = '') {
  return useQuery({
    queryKey: ['rajaongkir', 'cities', search],
    queryFn: async () => {
      const params = search ? { search } : {}
      const { data } = await api.get('/rajaongkir/cities', { params })
      return data.data || []
    },
    staleTime: 24 * 60 * 60_000,
    enabled: search.length === 0 || search.length >= 2,
  })
}

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await api.get('/addresses')
      return data.data
    },
  })
}

export function useSaveAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const url = id ? `/addresses/${id}` : '/addresses'
      const method = id ? 'put' : 'post'
      const { data } = await api[method](url, payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  })
}

export function useDeleteAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/addresses/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  })
}

export function useWishlist() {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get('/wishlist')
      return data.data
    },
  })
}

export function useWishlistIds() {
  return useQuery({
    queryKey: ['wishlist', 'ids'],
    queryFn: async () => {
      const { data } = await api.get('/wishlist/ids')
      return data.data || []
    },
    staleTime: 60_000,
  })
}

export function useToggleWishlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (productId) => {
      const { data } = await api.post('/wishlist/toggle', { product_id: productId })
      return data.in_wishlist
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })
}

export function useOrders(params = {}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params })
      return data
    },
  })
}

export function useOrder(orderNumber) {
  return useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${orderNumber}`)
      return data.data
    },
    enabled: !!orderNumber,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put('/profile', payload)
      return data.user
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put('/profile/password', payload)
      return data
    },
  })
}
