import type { Instrument } from '@/entities/instrument/model/types'
import { http } from '@/shared/api/http'

export async function searchInstruments(
  query: string,
  signal?: AbortSignal,
): Promise<Instrument[]> {
  const encoded = encodeURIComponent(query)
  return http.get<Instrument[]>(`/search?query=${encoded}`, { signal })
}
