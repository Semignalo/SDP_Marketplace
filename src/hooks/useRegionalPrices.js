import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

/*
 * Endpoint admin & vendor bentuknya identik, cuma beda prefix — vendor otomatis
 * ter-scope ke produknya sendiri di server. `scope` cukup 'admin' | 'vendor'.
 */
const base = (scope, productId) => `/${scope}/products/${productId}/regional-prices`

export function useRegionalPrices(scope, productId) {
  return useQuery({
    queryKey: [scope, 'regional-prices', productId],
    queryFn: async () => (await api.get(base(scope, productId))).data.data,
    enabled: !!productId,
  })
}

export function useSaveRegionalPrices(scope) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, prices }) =>
      (await api.put(base(scope, productId), { prices })).data.data,
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({ queryKey: [scope, 'regional-prices', productId] })
      // Harga yang tampil di listing panel ikut berubah.
      qc.invalidateQueries({ queryKey: [scope, 'products'] })
    },
  })
}
