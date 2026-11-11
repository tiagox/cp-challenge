import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { useLocation, useNavigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useOrderTicket } from '@/features/order'
import { API_BASE_URL } from '@/shared/api/config'
import { dyca, instrumentsFixture } from '@/test/fixtures/instruments'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import InstrumentsPage from './InstrumentsPage'

const searchUrl = `${API_BASE_URL}/search`

function recordSearchQueries() {
  const queries: (string | null)[] = []
  // Records and falls through to the default handler.
  server.use(
    http.get(searchUrl, ({ request }) => {
      queries.push(new URL(request.url).searchParams.get('query'))
    }),
  )
  return queries
}

function Harness() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = useOrderTicket()
  return (
    <>
      <output data-testid="location">{location.pathname + location.search}</output>
      <pre data-testid="ticket">{JSON.stringify(state)}</pre>
      <button type="button" onClick={() => void navigate('/instruments?q=a')}>
        go to a
      </button>
      <button type="button" onClick={() => void navigate(-1)}>
        go back
      </button>
    </>
  )
}

function renderPage(route = '/instruments', lang?: 'es') {
  return renderWithProviders(
    <>
      <InstrumentsPage />
      <Harness />
    </>,
    { route, lang },
  )
}

const searchbox = () => screen.getByRole('searchbox', { name: 'Search by ticker' })
const location = () => screen.getByTestId('location').textContent

function rowFor(table: HTMLElement, ticker: string) {
  const header = within(table).getByRole('rowheader', { name: new RegExp(`^${ticker}`) })
  const row = header.closest('tr')
  if (!row) throw new Error(`No row for ${ticker}`)
  return row
}

async function expectRows(count: number) {
  await waitFor(() =>
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(count + 1),
  )
}

describe('InstrumentsPage search', () => {
  it('shows the full list for an empty box without calling /search', async () => {
    const queries = recordSearchQueries()
    renderPage()

    await screen.findByRole('table')
    await expectRows(instrumentsFixture.length)
    expect(screen.getByText('4 instruments')).toBeInTheDocument()
    expect(queries).toHaveLength(0)
  })

  it('debounces typing into one request and writes ?q= to the URL', async () => {
    const queries = recordSearchQueries()
    renderPage()
    await screen.findByRole('table')

    await userEvent.type(searchbox(), 'dy')

    expect(await screen.findByText('1 result for “dy”')).toBeInTheDocument()
    await expectRows(1)
    expect(queries).toEqual(['dy'])
    expect(location()).toBe('/instruments?q=dy')
    expect(screen.queryByText('4 instruments')).not.toBeInTheDocument()
  })

  it('shows the skeleton instead of previous results while the next search loads', async () => {
    renderPage('/instruments?q=dy')
    const results = await screen.findByText('1 result for “dy”')

    let respond: (() => void) | undefined
    server.use(
      http.get(searchUrl, async () => {
        await new Promise<void>((resolve) => (respond = resolve))
        return HttpResponse.json([])
      }),
    )
    await userEvent.type(searchbox(), 'z')

    await waitFor(() => expect(screen.queryByRole('table')).not.toBeInTheDocument())
    expect(screen.getAllByText('Loading...')[0]).toBeInTheDocument()
    // The same live region stays mounted and empties, so the new count is announced.
    expect(results).toBeInTheDocument()
    expect(results).toBeEmptyDOMElement()

    // Release the response only once the request is in flight.
    await waitFor(() => expect(respond).toBeDefined())
    respond?.()
    expect(await screen.findByRole('heading', { name: 'No instruments found' })).toBeInTheDocument()
    expect(results).toHaveTextContent('0 results for “dyz”')
  })

  it('populates the box and results from an initial ?q=', async () => {
    renderPage('/instruments?q=dy')

    expect(searchbox()).toHaveValue('dy')
    expect(await screen.findByText('1 result for “dy”')).toBeInTheDocument()
    await expectRows(1)
  })

  it('syncs the box with back/forward navigation', async () => {
    renderPage('/instruments?q=dy')
    await screen.findByText('1 result for “dy”')

    await userEvent.click(screen.getByRole('button', { name: 'go to a' }))
    expect(searchbox()).toHaveValue('a')
    expect(await screen.findByText('3 results for “a”')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'go back' }))
    expect(searchbox()).toHaveValue('dy')
    expect(await screen.findByText('1 result for “dy”')).toBeInTheDocument()
    expect(location()).toBe('/instruments?q=dy')
  })

  it('renders ticker, name, price and return for results', async () => {
    renderPage('/instruments?q=dy')
    await screen.findByText('1 result for “dy”')
    const row = rowFor(screen.getByRole('table'), 'DYCA')

    expect(within(row).getByText(dyca.name)).toBeInTheDocument()
    expect(within(row).getByText('ARS 50.07')).toBeInTheDocument()
    expect(within(row).getByText('+9.51%')).toBeInTheDocument()
  })

  it('renders the empty state with the query and clears from its action', async () => {
    renderPage('/instruments?q=zz')

    const heading = await screen.findByRole('heading', { name: 'No instruments found' })
    expect(screen.getByText('No results for “zz”. Try another ticker.')).toBeInTheDocument()
    expect(screen.getByText('0 results for “zz”')).toBeInTheDocument()

    const state = heading.parentElement as HTMLElement
    await userEvent.click(within(state).getByRole('button', { name: 'Clear search' }))

    expect(searchbox()).toHaveValue('')
    expect(searchbox()).toHaveFocus()
    await expectRows(instrumentsFixture.length)
    await waitFor(() => expect(location()).toBe('/instruments'))
  })

  it('renders an error with a retry that refetches the search', async () => {
    server.use(
      http.get(searchUrl, () => HttpResponse.json({ error: 'boom' }, { status: 500 }), {
        once: true,
      }),
    )
    const queries = recordSearchQueries()
    renderPage('/instruments?q=dy')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The server returned an error.')
    expect(searchbox()).toBeEnabled()

    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('1 result for “dy”')).toBeInTheDocument()
    // The failed request plus the retry.
    expect(queries).toEqual(['dy', 'dy'])
  })

  it('opens the order ticket in BUY mode from a result', async () => {
    renderPage('/instruments?q=dy')
    await screen.findByText('1 result for “dy”')

    await userEvent.click(
      within(rowFor(screen.getByRole('table'), 'DYCA')).getByRole('button', { name: 'Trade' }),
    )

    expect(JSON.parse(screen.getByTestId('ticket').textContent ?? '')).toMatchObject({
      isOpen: true,
      presetSide: 'BUY',
      instrument: { id: dyca.id, ticker: 'DYCA', name: dyca.name, last_price: dyca.last_price },
    })
  })

  it('clears the box and URL from the clear button and restores the full list', async () => {
    renderPage('/instruments?q=dy')
    await screen.findByText('1 result for “dy”')

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(searchbox()).toHaveValue('')
    await expectRows(instrumentsFixture.length)
    await waitFor(() => expect(location()).toBe('/instruments'))
    expect(screen.queryByText(/results? for/)).not.toBeInTheDocument()
  })

  it('does not revive the cleared query when typing right after clearing', async () => {
    const queries = recordSearchQueries()
    renderPage('/instruments?q=dy')
    await screen.findByText('1 result for “dy”')

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    await userEvent.type(searchbox(), 'a')

    expect(screen.queryByText('1 result for “dy”')).not.toBeInTheDocument()
    expect(location()).toBe('/instruments')
    expect(await screen.findByText('3 results for “a”')).toBeInTheDocument()
    expect(queries).toEqual(['dy', 'a'])
  })

  it('renders ES copy', async () => {
    renderPage('/instruments?q=dy', 'es')

    expect(screen.getByRole('searchbox', { name: 'Buscar por ticker' })).toHaveAttribute(
      'placeholder',
      'ej. DYCA',
    )
    expect(await screen.findByText('1 resultado para “dy”')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpiar búsqueda' })).toBeInTheDocument()
  })
})
