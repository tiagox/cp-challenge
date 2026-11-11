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
  const { data, error, isPending, refetch } = useInstruments()
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

  let content
  if (isPending) {
    content = <InstrumentsSkeleton />
  } else if (error) {
    content = (
      <ErrorState
        title={t('errors.unexpected')}
        description={t(errorKey(error))}
        onRetry={() => void refetch()}
      />
    )
  } else if (data.length === 0) {
    content = (
      <EmptyState
        title={t('instruments.empty.title')}
        description={t('instruments.empty.description')}
      />
    )
  } else {
    content = (
      <>
        <InstrumentsTable instruments={data} onSelect={handleSelect} />
        <InstrumentsCards instruments={data} onSelect={handleSelect} />
      </>
    )
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
