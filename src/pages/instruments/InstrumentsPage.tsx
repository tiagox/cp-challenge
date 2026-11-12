import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Instrument } from '@/entities/instrument/model/types'
import { InstrumentsCards, InstrumentsSkeleton, InstrumentsTable } from '@/features/instruments'
import { useOrderTicket } from '@/features/order'
import { SearchInput } from '@/features/search'
import { errorKey } from '@/shared/api/errors'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { PageHeader } from '@/shared/ui/PageHeader'
import styles from './InstrumentsPage.module.scss'
import { useInstrumentList } from './useInstrumentList'

export default function InstrumentsPage() {
  const { t } = useTranslation()
  const { input, setInput, query, searching, data, error, isFetching, refetch } =
    useInstrumentList()

  const searchInputRef = useRef<HTMLInputElement>(null)
  const clearSearch = () => {
    setInput('')
    // The empty state and its button unmount, so keep focus in the search box.
    searchInputRef.current?.focus()
  }

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
    if (data.length > 0) {
      content = (
        <>
          <InstrumentsTable instruments={data} onSelect={handleSelect} />
          <InstrumentsCards instruments={data} onSelect={handleSelect} />
        </>
      )
    } else if (searching) {
      content = (
        <EmptyState
          title={t('search.empty.title')}
          description={t('search.empty.description', { query })}
          action={
            <Button variant="secondary" onClick={clearSearch}>
              {t('search.input.clear')}
            </Button>
          }
        />
      )
    } else {
      content = (
        <EmptyState
          title={t('instruments.empty.title')}
          description={t('instruments.empty.description')}
        />
      )
    }
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
          !searching && data ? (
            <span className={styles.count}>{t('instruments.count', { count: data.length })}</span>
          ) : null
        }
      />
      <div className={styles.search}>
        <SearchInput ref={searchInputRef} value={input} onChange={setInput} />
        {/* Stays mounted while loading: screen readers announce text changes, not insertions. */}
        {searching ? (
          <p role="status" className={styles.status}>
            {data ? t('search.results', { count: data.length, query }) : null}
          </p>
        ) : null}
      </div>
      {content}
    </>
  )
}
