import { useTranslation } from 'react-i18next'
import type { Instrument } from '@/entities/instrument/model/types'
import {
  InstrumentsCards,
  InstrumentsSkeleton,
  InstrumentsTable,
  useInstruments,
} from '@/features/instruments'
import { useOrderTicket } from '@/features/order'
import { ApiError } from '@/shared/api/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageHeader } from '@/shared/ui/PageHeader'
import styles from './InstrumentsPage.module.scss'

function errorKey(error: unknown) {
  if (error instanceof ApiError && error.code === 'NETWORK') return 'errors.network'
  if (error instanceof ApiError && error.code === 'TIMEOUT') return 'errors.timeout'
  return 'errors.server'
}

export default function InstrumentsPage() {
  const { t } = useTranslation()
  const { data, error, isFetching, refetch } = useInstruments()
  const { open } = useOrderTicket()

  const handleSelect = (instrument: Instrument) => {
    open({
      instrument: {
        id: instrument.id,
        ticker: instrument.ticker,
        name: instrument.name,
        last_price: instrument.last_price,
      },
      side: 'BUY',
    })
  }

  // Data first: a failed background refetch keeps the old list instead of hiding it.
  let content
  if (data) {
    content =
      data.length === 0 ? (
        <EmptyState
          title={t('instruments.empty.title')}
          description={t('instruments.empty.description')}
        />
      ) : (
        <>
          <InstrumentsTable instruments={data} onSelect={handleSelect} />
          <InstrumentsCards instruments={data} onSelect={handleSelect} />
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
    content = <InstrumentsSkeleton />
  }

  return (
    <>
      <PageHeader
        title={t('instruments.title')}
        description={t('instruments.description')}
        actions={
          data ? (
            <span className={styles.count}>{t('instruments.count', { count: data.length })}</span>
          ) : null
        }
      />
      {content}
    </>
  )
}
