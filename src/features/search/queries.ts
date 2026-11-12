import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { searchInstruments } from './api'

export function useSearchInstruments(query: string) {
  // Tickers are uppercase; the API's bug modes make matching case-sensitive.
  const normalized = query.trim().toUpperCase()

  return useQuery({
    queryKey: queryKeys.search(normalized),
    queryFn: ({ signal }) => searchInstruments(normalized, signal),
    enabled: normalized.length >= 1,
  })
}
