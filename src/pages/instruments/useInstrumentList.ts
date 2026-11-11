import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInstruments } from '@/features/instruments'
import { useSearchInstruments } from '@/features/search'
import { useDebouncedValue } from '@/shared/lib/hooks/useDebouncedValue'

/**
 * The instruments page's list: the full list for an empty box, `/search` results otherwise.
 * Owns the box value, its debounce and the `?q=` sync. Lives in the page layer because it
 * composes two features.
 */
export function useInstrumentList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = (searchParams.get('q') ?? '').trim()

  const [input, setInput] = useState(urlQuery)
  // Back/forward: adopt the URL value when it changes from outside the box.
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery)
    if (urlQuery !== input.trim()) setInput(urlQuery)
  }

  // No delay once empty, so typing right after a clear never revives the old query.
  const debounced = useDebouncedValue(input, input.trim() ? 300 : 0)
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

  return { input, setInput, query, searching, data, error, isFetching, refetch }
}
