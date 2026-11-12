import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Portfolio } from '@/entities/position/model/types'
import { queryKeys } from '@/shared/api/queryKeys'
import { getPortfolio } from './api'

export function usePortfolio() {
  const { t } = useTranslation()
  // Stable per language so `select` only reruns when the data or the language changes.
  const withTickers = useCallback(
    (portfolio: Portfolio): Portfolio => ({
      ...portfolio,
      // The API can drop `ticker` from a holding; every consumer gets `#id` instead.
      holdings: portfolio.holdings.map((holding) => ({
        ...holding,
        ticker:
          holding.ticker ??
          t('portfolio.positions.unknownInstrument', { id: holding.instrument_id }),
      })),
    }),
    [t],
  )

  return useQuery({
    queryKey: queryKeys.portfolio,
    queryFn: ({ signal }) => getPortfolio(signal),
    select: withTickers,
  })
}
