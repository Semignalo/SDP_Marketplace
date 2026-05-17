import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

/* ───────── Dashboard ───────── */
export function useAdminSummary() {
  return useQuery({
    queryKey: ['admin', 'summary'],
    queryFn: async () => (await api.get('/admin/summary')).data.data,
  })
}

export function useAdminRevenueChart(days = 30) {
  return useQuery({
    queryKey: ['admin', 'chart', days],
    queryFn: async () => (await api.get('/admin/revenue-chart', { params: { days } })).data.data,
  })
}

/* ───────── Users ───────── */
export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => (await api.get('/admin/users', { params })).data,
  })
}

export function useUpdateAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.put(`/admin/users/${id}`, payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useDeleteAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { await api.delete(`/admin/users/${id}`) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

/* ───────── Vendors ───────── */
export function useAdminVendors(params = {}) {
  return useQuery({
    queryKey: ['admin', 'vendors', params],
    queryFn: async () => (await api.get('/admin/vendors', { params })).data,
  })
}

export function useSaveAdminVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const url = id ? `/admin/vendors/${id}` : '/admin/vendors'
      const method = id ? 'put' : 'post'
      const { data } = await api[method](url, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      qc.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export function useDeleteAdminVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { await api.delete(`/admin/vendors/${id}`) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'vendors'] }),
  })
}

/* ───────── Categories ───────── */
export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await api.get('/admin/categories')).data.data,
  })
}

export function useSaveAdminCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const url = id ? `/admin/categories/${id}` : '/admin/categories'
      const method = id ? 'put' : 'post'
      const { data } = await api[method](url, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteAdminCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { await api.delete(`/admin/categories/${id}`) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  })
}

/* ───────── Products ───────── */
export function useAdminProducts(params = {}) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: async () => (await api.get('/admin/products', { params })).data,
  })
}

export function useCreateAdminProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.post('/admin/products', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useUpdateAdminProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.put(`/admin/products/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useUpdateAdminProductStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => (await api.put(`/admin/products/${id}/status`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useDeleteAdminProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => { await api.delete(`/admin/products/${id}`) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

/* ───────── Orders ───────── */
export function useAdminOrders(params = {}) {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: async () => (await api.get('/admin/orders', { params })).data,
  })
}

export function useAdminOrder(orderNumber) {
  return useQuery({
    queryKey: ['admin', 'order', orderNumber],
    queryFn: async () => (await api.get(`/admin/orders/${orderNumber}`)).data.data,
    enabled: !!orderNumber,
  })
}

export function useUpdateAdminOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderNumber, ...payload }) => (await api.put(`/admin/orders/${orderNumber}/status`, payload)).data,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
      qc.invalidateQueries({ queryKey: ['admin', 'order', vars.orderNumber] })
      qc.invalidateQueries({ queryKey: ['admin', 'commissions'] })
    },
  })
}

/* ───────── Commissions ───────── */
export function useAdminCommissions(params = {}) {
  return useQuery({
    queryKey: ['admin', 'commissions', params],
    queryFn: async () => (await api.get('/admin/commissions', { params })).data,
  })
}

export function useUpdateAdminCommissionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => (await api.put(`/admin/commissions/${id}/status`, { status })).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'commissions'] }),
  })
}

export function useBulkMarkCommissionsPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (commissionIds) => (await api.post('/admin/commissions/bulk-mark-paid', { commission_ids: commissionIds })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'commissions'] }),
  })
}

/* ───────── Settings ───────── */
export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => (await api.get('/admin/settings')).data.data,
  })
}

export function useUpdateAdminSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (settings) => (await api.put('/admin/settings', { settings })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}
