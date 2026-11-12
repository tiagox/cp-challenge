import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { searchInstruments } from './api'

export function useSearchInstruments(query: string) {
  const normalized = query.trim()

  return useQuery({
    queryKey: queryKeys.search(normalized),
    queryFn: ({ signal }) => searchInstruments(normalized, signal),
    enabled: normalized.length >= 1,
  })
}
