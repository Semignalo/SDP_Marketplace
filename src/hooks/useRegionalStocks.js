import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const base = (scope, productId) => `/${scope}/products/${productId}/regional-stocks`

export function useRegionalStocks(scope, productId) {
  return useQuery({
    queryKey: [scope, 'regional-stocks', productId],
    queryFn: async () => (await api.get(base(scope, productId))).data.data,
    enabled: !!productId,
  })
}

export function useSaveRegionalStocks(scope) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, stocks }) =>
      (await api.put(base(scope, productId), { stocks })).data.data,
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({ queryKey: [scope, 'regional-stocks', productId] })
      qc.invalidateQueries({ queryKey: [scope, 'products'] })
    },
  })
}
