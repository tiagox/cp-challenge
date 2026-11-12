import { act, renderHook, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/shared/api/config'
import { createTestQueryClient, renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { SearchInput, useSearchInstruments } from '.'

const searchUrl = `${API_BASE_URL}/search`

function recordSearchRequests() {
  const urls: URL[] = []
  // Records and falls through to the default handler.
  server.use(
    http.get(searchUrl, ({ request }) => {
      urls.push(new URL(request.url))
    }),
  )
  return urls
}

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

function ControlledSearch() {
  const [value, setValue] = useState('')
  return <SearchInput value={value} onChange={setValue} />
}

describe('SearchInput', () => {
  it('renders the label and shows the clear button only when non-empty', async () => {
    renderWithProviders(<ControlledSearch />)
    const input = screen.getByRole('searchbox', { name: 'Search by ticker' })

    expect(screen.getByRole('search')).toContainElement(input)
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()

    await userEvent.type(input, 'dy')
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })
})

describe('useSearchInstruments', () => {
  it('does not request for empty or whitespace input', async () => {
    const urls = recordSearchRequests()
    const { result, rerender } = renderHook(({ query }) => useSearchInstruments(query), {
      wrapper,
      initialProps: { query: '' },
    })
    rerender({ query: '   ' })
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))

    expect(result.current.fetchStatus).toBe('idle')
    expect(urls).toHaveLength(0)
  })

  it('sends the trimmed, uppercased, encoded query parameter', async () => {
    const urls = recordSearchRequests()
    const { result } = renderHook(() => useSearchInstruments(' a&b c '), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(urls).toHaveLength(1)
    expect(urls[0]?.search).toBe('?query=A%26B%20C')
    expect(urls[0]?.searchParams.get('query')).toBe('A&B C')
  })
})
