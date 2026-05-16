import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useResellerSummary(enabled = true) {
  return useQuery({
    queryKey: ['reseller', 'summary'],
    queryFn: async () => {
      const { data } = await api.get('/reseller/summary')
      return data.data
    },
    enabled,
  })
}

export function useResellerCommissions(params = {}, enabled = true) {
  return useQuery({
    queryKey: ['reseller', 'commissions', params],
    queryFn: async () => {
      const { data } = await api.get('/reseller/commissions', { params })
      return data
    },
    enabled,
  })
}
