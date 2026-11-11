import type { Instrument } from '@/entities/instrument/model/types'
import { http } from '@/shared/api/http'

export async function getInstruments(signal?: AbortSignal): Promise<Instrument[]> {
  return http.get<Instrument[]>('/instruments', { signal })
}
