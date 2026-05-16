import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useProducts(params = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await api.get('/products', { params })
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}`)
      return data
    },
    enabled: !!slug,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories')
      return data.data
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data } = await api.get('/vendors')
      return data.data
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useVendor(slug) {
  return useQuery({
    queryKey: ['vendor', slug],
    queryFn: async () => {
      const { data } = await api.get(`/vendors/${slug}`)
      return data
    },
    enabled: !!slug,
  })
}

export function usePublicSettings() {
  return useQuery({
    queryKey: ['settings', 'public'],
    queryFn: async () => {
      const { data } = await api.get('/settings/public')
      return data.data
    },
    staleTime: 30 * 60 * 1000,
  })
}
