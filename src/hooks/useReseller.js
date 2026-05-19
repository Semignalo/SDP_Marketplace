import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export function useResellerNetwork(enabled = true) {
  return useQuery({
    queryKey: ['reseller', 'network'],
    queryFn: async () => {
      const { data } = await api.get('/reseller/network')
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

export function useResellerWithdrawals(params = {}) {
  return useQuery({
    queryKey: ['reseller', 'withdrawals', params],
    queryFn: async () => {
      const { data } = await api.get('/reseller/withdrawals', { params })
      return data
    },
  })
}

export function useSubmitWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/reseller/withdrawals', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reseller', 'withdrawals'] })
      qc.invalidateQueries({ queryKey: ['reseller', 'summary'] })
    },
  })
}
