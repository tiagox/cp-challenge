import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import type { Instrument } from '@/entities/instrument/model/types'
import {
  InstrumentsCards,
  InstrumentsSkeleton,
  InstrumentsTable,
  useInstruments,
} from '@/features/instruments'
import { useOrderTicket } from '@/features/order'
import { SearchInput, useSearchInstruments } from '@/features/search'
import { ApiError } from '@/shared/api/errors'
import { useDebouncedValue } from '@/shared/lib/hooks/useDebouncedValue'
import { Button } from '@/shared/ui/Button'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = (searchParams.get('q') ?? '').trim()

  const [input, setInput] = useState(urlQuery)
  // Back/forward: adopt the URL value when it changes from outside the box.
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery)
    if (urlQuery !== input.trim()) setInput(urlQuery)
  }

  const debounced = useDebouncedValue(input, 300)
  // Typing is debounced; clearing restores the full list at once.
  const query = input.trim() ? debounced.trim() : ''
  const searching = query !== ''

  // Write only when the query itself changes, so URL-driven renders never write back.
  const writtenQuery = useRef(query)
  useEffect(() => {
    if (query === writtenQuery.current) return
    writtenQuery.current = query
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (query) next.set('q', query)
        else next.delete('q')
        return next
      },
      { replace: true },
    )
  }, [query, setSearchParams])

  const instruments = useInstruments()
  const search = useSearchInstruments(query)
  const { data, error, isFetching, refetch } = searching ? search : instruments
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
            <Button variant="secondary" onClick={() => setInput('')}>
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
        <SearchInput value={input} onChange={setInput} />
        {searching && data ? (
          <p role="status" className={styles.status}>
            {t('search.results', { count: data.length, query })}
          </p>
        ) : null}
      </div>
      {content}
    </>
  )
}
