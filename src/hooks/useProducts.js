import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useActiveCountry } from './useRegion'

/*
 * `country` ikut dikirim ke API produk supaya server memuat override harga regional
 * yang tepat, dan ikut masuk queryKey supaya cache tidak tercampur antar-region.
 */
export function useProducts(params = {}) {
  const country = useActiveCountry()
  const query = country ? { ...params, country } : params

  return useQuery({
    queryKey: ['products', query],
    queryFn: async () => {
      const { data } = await api.get('/products', { params: query })
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function useProduct(slug) {
  const country = useActiveCountry()

  return useQuery({
    queryKey: ['product', slug, country],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}`, { params: country ? { country } : {} })
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

export function useVendor(slug, params = {}) {
  const country = useActiveCountry()
  const query = country ? { ...params, country } : params

  return useQuery({
    queryKey: ['vendor', slug, query],
    queryFn: async () => {
      const { data } = await api.get(`/vendors/${slug}`, { params: query })
      return data
    },
    enabled: !!slug,
    placeholderData: (prev) => prev,
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
