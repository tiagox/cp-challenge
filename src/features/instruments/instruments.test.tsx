import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { useOrderTicket } from '@/features/order'
import InstrumentsPage from '@/pages/instruments/InstrumentsPage'
import { API_BASE_URL } from '@/shared/api/config'
import { queryKeys } from '@/shared/api/queryKeys'
import { capx, dyca, instrumentsFixture } from '@/test/fixtures/instruments'
import { createTestQueryClient, renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

const instrumentsUrl = `${API_BASE_URL}/instruments`

function TicketState() {
  const { state } = useOrderTicket()
  return <pre data-testid="ticket">{JSON.stringify(state)}</pre>
}

function rowFor(table: HTMLElement, ticker: string) {
  const header = within(table).getByRole('rowheader', { name: new RegExp(`^${ticker}`) })
  const row = header.closest('tr')
  if (!row) throw new Error(`No row for ${ticker}`)
  return row
}

// Table and cards are both in the DOM and toggled by CSS, which jsdom does not apply,
// so queries are scoped to the table or a card.
describe('InstrumentsPage', () => {
  it('renders all fixture instruments on desktop', async () => {
    renderWithProviders(<InstrumentsPage />)
    const table = await screen.findByRole('table')

    // Header row + one row per instrument.
    expect(within(table).getAllByRole('row')).toHaveLength(instrumentsFixture.length + 1)
    expect(screen.getByText('4 instruments')).toBeInTheDocument()
  })

  it('shows ticker, name, formatted last price and return', async () => {
    renderWithProviders(<InstrumentsPage />)
    const row = rowFor(await screen.findByRole('table'), 'DYCA')

    expect(within(row).getByText('DYCA')).toBeInTheDocument()
    expect(within(row).getByText(dyca.name)).toBeInTheDocument()
    expect(within(row).getByText('ARS 50.07')).toBeInTheDocument()
    expect(within(row).getByText('+9.51%')).toBeInTheDocument()
  })

  it('renders positive, negative, zero and invalid returns', async () => {
    server.use(
      http.get(instrumentsUrl, () =>
        HttpResponse.json([
          ...instrumentsFixture,
          { ...capx, id: 99, ticker: 'BAD', close_price: 0 },
        ]),
      ),
    )
    renderWithProviders(<InstrumentsPage />)
    const table = await screen.findByRole('table')

    expect(within(rowFor(table, 'DYCA')).getByText('+9.51%')).toBeInTheDocument()
    expect(within(rowFor(table, 'CAPX')).getByText('-7.40%')).toBeInTheDocument()
    expect(within(rowFor(table, 'MIRG')).getByText('-100.00%')).toBeInTheDocument()
    expect(within(rowFor(table, 'ARS')).getByText('+0.00%')).toBeInTheDocument()
    expect(within(rowFor(table, 'BAD')).getByText('—')).toBeInTheDocument()
    expect(table).not.toHaveTextContent(/NaN|Infinity/)
  })

  it('renders the type badge labels in EN', async () => {
    renderWithProviders(<InstrumentsPage />)
    const table = await screen.findByRole('table')

    expect(within(rowFor(table, 'DYCA')).getByText('Stocks')).toBeInTheDocument()
    expect(within(rowFor(table, 'ARS')).getByText('Currency')).toBeInTheDocument()
  })

  it('renders ES copy', async () => {
    renderWithProviders(<InstrumentsPage />, { lang: 'es' })
    const table = await screen.findByRole('table')

    expect(screen.getByRole('heading', { level: 1, name: 'Instrumentos' })).toBeInTheDocument()
    expect(screen.getByText('4 instrumentos')).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Último precio' })).toBeInTheDocument()
    expect(within(rowFor(table, 'ARS')).getByText('Moneda')).toBeInTheDocument()
    expect(within(rowFor(table, 'DYCA')).getByText('+9,51%')).toBeInTheDocument()
    expect(within(table).getAllByRole('button', { name: 'Operar' })).toHaveLength(4)
  })

  it('renders skeletons while loading', () => {
    renderWithProviders(<InstrumentsPage />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading...')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders an error with a retry that refetches', async () => {
    server.use(
      http.get(instrumentsUrl, () => HttpResponse.json({ error: 'boom' }, { status: 500 }), {
        once: true,
      }),
    )
    renderWithProviders(<InstrumentsPage />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong. Please try again.')
    expect(alert).toHaveTextContent('The server returned an error.')

    let respond = () => {}
    server.use(
      http.get(instrumentsUrl, async () => {
        await new Promise<void>((resolve) => (respond = resolve))
        return HttpResponse.json(instrumentsFixture)
      }),
    )
    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }))

    // The skeleton replaces the error while the retry runs.
    expect(await screen.findByRole('status')).toHaveTextContent('Loading...')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    respond()
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })

  it('keeps the list when a background refetch fails', async () => {
    const queryClient = createTestQueryClient()
    renderWithProviders(<InstrumentsPage />, { queryClient })
    await screen.findByRole('table')

    server.use(
      http.get(instrumentsUrl, () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    )
    await queryClient.refetchQueries({ queryKey: queryKeys.instruments })

    expect(queryClient.getQueryState(queryKeys.instruments)?.status).toBe('error')
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders the network error copy', async () => {
    server.use(http.get(instrumentsUrl, () => HttpResponse.error()))
    renderWithProviders(<InstrumentsPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Network error. Check your connection and try again.',
    )
  })

  it('renders the empty state when the API returns []', async () => {
    server.use(http.get(instrumentsUrl, () => HttpResponse.json([])))
    renderWithProviders(<InstrumentsPage />)

    expect(
      await screen.findByRole('heading', { name: 'No instruments available' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Please try again later.')).toBeInTheDocument()
  })

  it('opens the order ticket in BUY mode from the Trade button', async () => {
    renderWithProviders(
      <>
        <InstrumentsPage />
        <TicketState />
      </>,
    )
    const row = rowFor(await screen.findByRole('table'), 'CAPX')

    await userEvent.click(within(row).getByRole('button', { name: 'Trade' }))

    expect(JSON.parse(screen.getByTestId('ticket').textContent ?? '')).toMatchObject({
      isOpen: true,
      presetSide: 'BUY',
      instrument: { id: capx.id, ticker: 'CAPX', name: capx.name, last_price: capx.last_price },
    })
  })

  it('opens the order ticket from a mobile card', async () => {
    renderWithProviders(
      <>
        <InstrumentsPage />
        <TicketState />
      </>,
    )
    const card = (await screen.findByRole('heading', { level: 2, name: /^DYCA/ })).closest(
      'article',
    )
    if (!card) throw new Error('No card for DYCA')

    await userEvent.click(within(card).getByRole('button', { name: 'Trade' }))

    expect(screen.getByTestId('ticket')).toHaveTextContent('"ticker":"DYCA"')
  })

  it('has a visually hidden caption', async () => {
    renderWithProviders(<InstrumentsPage />)

    expect(await screen.findByRole('table', { name: 'Instruments' })).toBeInTheDocument()
  })
})
