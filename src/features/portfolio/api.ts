import type { Portfolio } from '@/entities/position/model/types'
import { http } from '@/shared/api/http'

export async function getPortfolio(signal?: AbortSignal): Promise<Portfolio> {
  return http.get<Portfolio>('/portfolio', { signal })
}
