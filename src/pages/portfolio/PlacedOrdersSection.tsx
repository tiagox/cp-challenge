import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInstruments } from '@/features/instruments'
import {
  PlacedOrdersCards,
  PlacedOrdersSkeleton,
  PlacedOrdersTable,
  usePlacedOrders,
} from '@/features/order'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { errorKey } from './errorKey'
import styles from './PortfolioPage.module.scss'

/** Loads and fails on its own, so it never blocks the summary or the positions. */
export function PlacedOrdersSection() {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const { data, error, isFetching, refetch } = usePlacedOrders()
  // Instruments only provide tickers; while they load or if they fail, rows show `#id`.
  const { data: instruments } = useInstruments()
  const tickers = useMemo(
    () => new Map(instruments?.map((instrument) => [instrument.id, instrument.ticker])),
    [instruments],
  )

  let content
  if (data) {
    content =
      data.length > 0 ? (
        <>
          <PlacedOrdersTable orders={data} tickers={tickers} />
          <PlacedOrdersCards orders={data} tickers={tickers} />
        </>
      ) : (
        <EmptyState
          title={t('orders.history.empty.title')}
          description={t('orders.history.empty.description')}
        />
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
    content = <PlacedOrdersSkeleton />
  }

  return (
    <section aria-labelledby="placed-orders-title" className={styles.section}>
      <div className={styles.sectionHeader}>
        {/* Disclosure: the heading's button names the section and toggles the list. */}
        <h2 id="placed-orders-title" className={styles.sectionTitle}>
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={expanded}
            aria-controls="placed-orders-content"
            onClick={() => setExpanded((value) => !value)}
          >
            {t('orders.history.title')}
            <ChevronDown aria-hidden className={styles.chevron} size={20} />
          </button>
        </h2>
        {data ? (
          <span className={styles.count}>{t('orders.history.count', { count: data.length })}</span>
        ) : null}
      </div>
      <div id="placed-orders-content" hidden={!expanded}>
        {content}
      </div>
    </section>
  )
}
