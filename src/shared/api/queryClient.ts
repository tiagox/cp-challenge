import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) =>
        error instanceof ApiError &&
        (error.code === 'NETWORK' || error.status >= 500) &&
        failureCount < 1,
    },
    mutations: {
      retry: false,
    },
  },
})
