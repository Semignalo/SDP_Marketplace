import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useVendorSummary(enabled = true) {
  return useQuery({
    queryKey: ['vendor', 'summary'],
    queryFn: async () => (await api.get('/vendor/summary')).data.data,
    enabled,
  })
}

export function useVendorRevenueChart(days = 30, enabled = true) {
  return useQuery({
    queryKey: ['vendor', 'chart', days],
    queryFn: async () => (await api.get('/vendor/revenue-chart', { params: { days } })).data.data,
    enabled,
  })
}

export function useVendorProducts(params = {}, enabled = true) {
  return useQuery({
    queryKey: ['vendor', 'products', params],
    queryFn: async () => (await api.get('/vendor/products', { params })).data,
    enabled,
  })
}

export function useVendorProduct(id, enabled = true) {
  return useQuery({
    queryKey: ['vendor', 'product', id],
    queryFn: async () => (await api.get(`/vendor/products/${id}`)).data.data,
    enabled: !!id && enabled,
  })
}

export function useSaveVendorProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const url = id ? `/vendor/products/${id}` : '/vendor/products'
      const method = id ? 'put' : 'post'
      const { data } = await api[method](url, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor', 'products'] })
      qc.invalidateQueries({ queryKey: ['vendor', 'summary'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeleteVendorProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/vendor/products/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor', 'products'] })
      qc.invalidateQueries({ queryKey: ['vendor', 'summary'] })
    },
  })
}

export function useVendorOrders(params = {}, enabled = true) {
  return useQuery({
    queryKey: ['vendor', 'orders', params],
    queryFn: async () => (await api.get('/vendor/orders', { params })).data,
    enabled,
  })
}

export function useVendorOrder(orderNumber) {
  return useQuery({
    queryKey: ['vendor', 'order', orderNumber],
    queryFn: async () => (await api.get(`/vendor/orders/${orderNumber}`)).data.data,
    enabled: !!orderNumber,
  })
}

export function useUpdateVendorOrderTracking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderNumber, ...payload }) => {
      const { data } = await api.put(`/vendor/orders/${orderNumber}/tracking`, payload)
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['vendor', 'orders'] })
      qc.invalidateQueries({ queryKey: ['vendor', 'order', vars.orderNumber] })
    },
  })
}

export function useVendorProfile(enabled = true) {
  return useQuery({
    queryKey: ['vendor', 'profile'],
    queryFn: async () => (await api.get('/vendor/profile')).data.data,
    enabled,
  })
}

export function useUpdateVendorProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.put('/vendor/profile', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor', 'profile'] })
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })
}
