import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { getInstruments } from './api'

export function useInstruments() {
  return useQuery({
    queryKey: queryKeys.instruments,
    queryFn: ({ signal }) => getInstruments(signal),
    staleTime: 60_000,
  })
}
