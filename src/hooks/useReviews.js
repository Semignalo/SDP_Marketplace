import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'

export function useProductReviews(slug, params = {}) {
  return useQuery({
    queryKey: ['reviews', slug, params],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}/reviews`, { params })
      return data
    },
    enabled: !!slug,
  })
}

export function useReviewEligibility(slug) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['review-eligibility', slug],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}/review-eligibility`)
      return data
    },
    enabled: !!slug && !!user,
  })
}

export function useSubmitReview(slug) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/reviews', payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', slug] })
      qc.invalidateQueries({ queryKey: ['review-eligibility', slug] })
      qc.invalidateQueries({ queryKey: ['product', slug] })
    },
  })
}
