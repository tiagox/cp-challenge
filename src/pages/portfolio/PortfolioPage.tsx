import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Holding } from '@/entities/position/model/types'
import { useOrderTicket } from '@/features/order'
import {
  PortfolioSkeleton,
  PortfolioSummary,
  PositionsCards,
  PositionsTable,
  usePortfolio,
} from '@/features/portfolio'
import { errorKey } from '@/shared/api/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PlacedOrdersSection } from './PlacedOrdersSection'
import styles from './PortfolioPage.module.scss'

export default function PortfolioPage() {
  const { t } = useTranslation()
  const { data, error, isFetching, refetch } = usePortfolio()
  const { open } = useOrderTicket()

  const handleSelect = (holding: Holding) => {
    open({
      instrument: {
        id: holding.instrument_id,
        ticker: holding.ticker,
        last_price: holding.last_price,
      },
      side: 'SELL',
      quantity: holding.quantity,
    })
  }

  // Data first: a failed background refetch keeps the old portfolio instead of hiding it.
  let content
  if (data) {
    content = (
      <>
        <PortfolioSummary portfolio={data} />
        <section aria-labelledby="positions-title">
          <div className={styles.sectionHeader}>
            <h2 id="positions-title" className={styles.sectionTitle}>
              {t('portfolio.positions.title')}
            </h2>
            <span className={styles.count}>
              {t('portfolio.positions.count', { count: data.holdings.length })}
            </span>
          </div>
          {data.holdings.length > 0 ? (
            <>
              <PositionsTable holdings={data.holdings} onSelect={handleSelect} />
              <PositionsCards holdings={data.holdings} onSelect={handleSelect} />
            </>
          ) : (
            <EmptyState
              title={t('portfolio.empty.title')}
              description={t('portfolio.empty.description')}
              action={
                <Link to="/instruments" className={styles.emptyAction}>
                  {t('portfolio.empty.action')}
                </Link>
              }
            />
          )}
        </section>
      </>
    )
  } else if (error && !isFetching) {
    content = (
      <ErrorState
        title={t('errors.unexpected')}
        description={t(errorKey(error))}
        onRetry={() => void refetch()}
      />
    )
  } else {
    content = <PortfolioSkeleton />
  }

  return (
    <>
      <PageHeader title={t('portfolio.title')} description={t('portfolio.description')} />
      {content}
      <PlacedOrdersSection />
    </>
  )
}
