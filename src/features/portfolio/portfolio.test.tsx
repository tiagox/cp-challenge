import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { useOrderTicket } from '@/features/order'
import PortfolioPage from '@/pages/portfolio/PortfolioPage'
import { API_BASE_URL } from '@/shared/api/config'
import { capxHolding, dycaHolding } from '@/test/fixtures/portfolio'
import { rowFor } from '@/test/helpers'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

const portfolioUrl = `${API_BASE_URL}/portfolio`

function TicketState() {
  const { state } = useOrderTicket()
  return <pre data-testid="ticket">{JSON.stringify(state)}</pre>
}

function summaryValue(label: string) {
  // The summary is the first <dl>; each mobile card has its own.
  const summary = document.querySelector('dl')
  if (!summary) throw new Error('No summary')
  const value = within(summary).getByText(label, { selector: 'dt' }).nextElementSibling
  if (!(value instanceof HTMLElement)) throw new Error(`No value for ${label}`)
  return value
}

// Table and cards are both in the DOM and toggled by CSS, which jsdom does not apply,
// so queries are scoped to the table, a card or the summary.
describe('PortfolioPage', () => {
  it('renders summary values from fixtures', async () => {
    renderWithProviders(<PortfolioPage />)
    await screen.findByRole('table', { name: 'Positions' })

    // DYCA 10 × 50.07 + CAPX 20 × 49.71 = 1,494.90; cost 450 + 1,100 = 1,550.
    expect(summaryValue('Available cash')).toHaveTextContent('ARS 1,000,000.00')
    expect(summaryValue('Market value')).toHaveTextContent('ARS 1,494.90')
    expect(summaryValue('Total P&L')).toHaveTextContent('-ARS 55.10')
    expect(summaryValue('Total return')).toHaveTextContent('-3.55%')
  })

  it('renders ticker, quantity, market value, P&L and return per position', async () => {
    renderWithProviders(<PortfolioPage />)
    const row = rowFor(await screen.findByRole('table', { name: 'Positions' }), 'DYCA')

    expect(within(row).getByText('10')).toBeInTheDocument()
    expect(within(row).getByText('ARS 500.70')).toBeInTheDocument()
    expect(within(row).getByText('+ARS 50.70')).toBeInTheDocument()
    expect(within(row).getByText('+11.27%')).toBeInTheDocument()
    expect(screen.getByText('2 positions')).toBeInTheDocument()
  })

  it('renders the same values on mobile cards', async () => {
    renderWithProviders(<PortfolioPage />)
    const card = (await screen.findByRole('heading', { level: 3, name: 'CAPX' })).closest('article')
    if (!card) throw new Error('No card for CAPX')

    expect(within(card).getByText('20')).toBeInTheDocument()
    expect(within(card).getByText('ARS 994.20')).toBeInTheDocument()
    expect(within(card).getByText('-ARS 105.80')).toBeInTheDocument()
    expect(within(card).getByText('-9.62%')).toBeInTheDocument()
  })

  it('uses positive and negative tones for P&L and return', async () => {
    renderWithProviders(<PortfolioPage />)
    const table = await screen.findByRole('table', { name: 'Positions' })

    expect(within(rowFor(table, 'DYCA')).getByText('+ARS 50.70').className).toMatch(/positive/)
    expect(within(rowFor(table, 'DYCA')).getByText('+11.27%').className).toMatch(/positive/)
    expect(within(rowFor(table, 'CAPX')).getByText('-ARS 105.80').className).toMatch(/negative/)
    expect(within(rowFor(table, 'CAPX')).getByText('-9.62%').className).toMatch(/negative/)
    expect(summaryValue('Total P&L').firstElementChild?.className).toMatch(/negative/)
  })

  it('renders — for the return of a zero average cost', async () => {
    server.use(
      http.get(portfolioUrl, () =>
        HttpResponse.json({ cash: 0, holdings: [{ ...dycaHolding, avg_cost_price: 0 }] }),
      ),
    )
    renderWithProviders(<PortfolioPage />)
    const row = rowFor(await screen.findByRole('table', { name: 'Positions' }), 'DYCA')

    expect(within(row).getByText('—')).toBeInTheDocument()
    expect(summaryValue('Total return')).toHaveTextContent('—')
    expect(document.body).not.toHaveTextContent(/NaN|Infinity/)
  })

  it('degrades a holding without ticker or average cost', async () => {
    // `hard` bug mode can drop these fields from a holding.
    // JSON drops `undefined`, so both fields arrive missing.
    const partial = { ...dycaHolding, ticker: undefined, avg_cost_price: undefined }
    server.use(
      http.get(portfolioUrl, () =>
        HttpResponse.json({ cash: 0, holdings: [partial, capxHolding] }),
      ),
    )
    renderWithProviders(<PortfolioPage />)
    const row = rowFor(await screen.findByRole('table', { name: 'Positions' }), '#1')

    expect(within(row).getAllByText('—')).toHaveLength(2)
    expect(within(row).getByRole('button', { name: 'Sell #1' })).toBeInTheDocument()
    expect(summaryValue('Total P&L')).toHaveTextContent('—')
    expect(summaryValue('Total return')).toHaveTextContent('—')
    expect(document.body).not.toHaveTextContent(/NaN|Infinity|undefined/)
  })

  it('renders EN copy by default', async () => {
    renderWithProviders(<PortfolioPage />)
    const table = await screen.findByRole('table', { name: 'Positions' })

    expect(screen.getByRole('heading', { level: 1, name: 'Portfolio' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Market value' })).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: 'Sell DYCA' })).toHaveTextContent('Sell')
  })

  it('renders ES copy', async () => {
    renderWithProviders(<PortfolioPage />, { lang: 'es' })
    const table = await screen.findByRole('table', { name: 'Posiciones' })

    expect(screen.getByRole('heading', { level: 1, name: 'Portafolio' })).toBeInTheDocument()
    expect(screen.getByText('2 posiciones')).toBeInTheDocument()
    expect(summaryValue('Efectivo disponible')).toHaveTextContent(/\$\s1\.000\.000,00/)
    expect(within(table).getByRole('columnheader', { name: 'Cantidad' })).toBeInTheDocument()
    expect(within(rowFor(table, 'DYCA')).getByText('+11,27%')).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: 'Vender DYCA' })).toHaveTextContent('Vender')
  })

  it('renders skeletons while loading', () => {
    renderWithProviders(<PortfolioPage />)

    // The first status is the portfolio skeleton; Placed orders has its own.
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Loading...')
    expect(screen.queryByRole('table', { name: 'Positions' })).not.toBeInTheDocument()
  })

  it('renders an error with a retry that refetches', async () => {
    server.use(
      http.get(portfolioUrl, () => HttpResponse.json({ error: 'boom' }, { status: 500 }), {
        once: true,
      }),
    )
    renderWithProviders(<PortfolioPage />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong. Please try again.')
    expect(alert).toHaveTextContent('The server returned an error.')

    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }))

    expect(await screen.findByRole('table', { name: 'Positions' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders the network error copy', async () => {
    server.use(http.get(portfolioUrl, () => HttpResponse.error()))
    renderWithProviders(<PortfolioPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Network error. Check your connection and try again.',
    )
  })

  it('renders cash and the empty state with a link to instruments', async () => {
    server.use(http.get(portfolioUrl, () => HttpResponse.json({ cash: 1_000_000, holdings: [] })))
    renderWithProviders(<PortfolioPage />)

    expect(await screen.findByRole('heading', { name: 'No positions yet' })).toBeInTheDocument()
    expect(summaryValue('Available cash')).toHaveTextContent('ARS 1,000,000.00')
    expect(screen.getByText('0 positions')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse instruments' })).toHaveAttribute(
      'href',
      '/instruments',
    )
  })

  it('opens the order ticket in SELL mode with the holding quantity', async () => {
    renderWithProviders(
      <>
        <PortfolioPage />
        <TicketState />
      </>,
    )
    const row = rowFor(await screen.findByRole('table', { name: 'Positions' }), 'CAPX')

    await userEvent.click(within(row).getByRole('button', { name: 'Sell CAPX' }))

    expect(JSON.parse(screen.getByTestId('ticket').textContent ?? '')).toEqual({
      presetSide: 'SELL',
      presetQuantity: capxHolding.quantity,
      instrument: {
        id: capxHolding.instrument_id,
        ticker: 'CAPX',
        last_price: capxHolding.last_price,
      },
    })
  })

  it('opens the order ticket from a mobile card', async () => {
    renderWithProviders(
      <>
        <PortfolioPage />
        <TicketState />
      </>,
    )
    const card = (await screen.findByRole('heading', { level: 3, name: 'DYCA' })).closest('article')
    if (!card) throw new Error('No card for DYCA')

    await userEvent.click(within(card).getByRole('button', { name: 'Sell DYCA' }))

    expect(JSON.parse(screen.getByTestId('ticket').textContent ?? '')).toMatchObject({
      presetSide: 'SELL',
      presetQuantity: dycaHolding.quantity,
    })
  })
})
