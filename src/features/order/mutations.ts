import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import type { CreateOrderRequest } from '@/shared/api/types'
import { createOrder } from './api'

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateOrderRequest) => createOrder(payload),
    // Orders are not idempotent: a retry could place the same order twice.
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.portfolio })
    },
  })
}
