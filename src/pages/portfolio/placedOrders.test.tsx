import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import PortfolioPage from '@/pages/portfolio/PortfolioPage'
import { API_BASE_URL } from '@/shared/api/config'
import { capx } from '@/test/fixtures/instruments'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

const ordersUrl = `${API_BASE_URL}/orders`
const instrumentsUrl = `${API_BASE_URL}/instruments`
const fail = () => HttpResponse.json({ error: 'boom' }, { status: 500 })

/** Intl output may use non-breaking spaces; normalize them before asserting. */
const text = (element: Element | null) =>
  element?.textContent?.replace(/[\u00a0\u202f]/g, ' ') ?? ''

const section = (name = 'Placed orders') => screen.getByRole('region', { name })

/** Cell texts per body row, as rendered. Waits for the table to appear. */
async function tableRows(name?: string) {
  const table = await within(section(name)).findByRole('table')
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell').map(text))
}

// The fixture is oldest first; the section shows newest first. Tests run in UTC.
describe('Placed orders section', () => {
  it('lists every order newest first with all columns', async () => {
    renderWithProviders(<PortfolioPage />)

    expect(await tableRows()).toEqual([
      [
        'Nov 12, 2026, 1:53 AM',
        'DYCA',
        'Sell',
        'Market',
        '3',
        'ARS 50.07',
        'ARS 150.21',
        'FilledFILLED',
      ],
      [
        'Nov 11, 2026, 9:30 AM',
        'CAPX',
        'Buy',
        'Market',
        '10',
        'ARS 49.71',
        'ARS 497.10',
        'FilledFILLED',
      ],
      [
        'Nov 10, 2026, 2:05 PM',
        'DYCA',
        'Buy',
        'Limit',
        '20',
        'ARS 48.50',
        'ARS 970.00',
        'RejectedREJECTED',
      ],
    ])
    expect(within(section()).getByText('3 orders')).toBeInTheDocument()
    expect(within(section()).getAllByRole('time')[0]).toHaveAttribute(
      'datetime',
      '2026-11-12T01:53:34.884Z',
    )
  })

  it('shows #id for an instrument missing from the instruments list', async () => {
    server.use(http.get(instrumentsUrl, () => HttpResponse.json([capx])))
    renderWithProviders(<PortfolioPage />)

    const tickers = (await tableRows()).map((cells) => cells[1])
    expect(tickers).toEqual(['#1', 'CAPX', '#1'])
  })

  it('still lists the orders with #id when instruments fail', async () => {
    server.use(http.get(instrumentsUrl, fail))
    renderWithProviders(<PortfolioPage />)

    const tickers = (await tableRows()).map((cells) => cells[1])
    expect(tickers).toEqual(['#1', '#2', '#1'])
    expect(within(section()).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders the skeleton while loading', () => {
    renderWithProviders(<PortfolioPage />)

    expect(within(section()).getByRole('status')).toHaveTextContent('Loading...')
    expect(within(section()).queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders an error with a retry that refetches', async () => {
    server.use(http.get(ordersUrl, fail, { once: true }))
    renderWithProviders(<PortfolioPage />)

    const alert = await within(section()).findByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong. Please try again.')
    expect(alert).toHaveTextContent('The server returned an error.')
    // The positions are not blocked by the orders error.
    expect(await screen.findByRole('table', { name: 'Positions' })).toBeInTheDocument()

    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }))

    expect(await tableRows()).toHaveLength(3)
    expect(within(section()).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders the empty state', async () => {
    server.use(http.get(ordersUrl, () => HttpResponse.json([])))
    renderWithProviders(<PortfolioPage />)

    expect(
      await within(section()).findByRole('heading', { name: 'No orders yet' }),
    ).toBeInTheDocument()
    expect(within(section()).getByText('Orders you place will appear here.')).toBeInTheDocument()
    expect(within(section()).getByText('0 orders')).toBeInTheDocument()
    // No action: the only button is the collapse toggle.
    expect(within(section()).getAllByRole('button')).toHaveLength(1)
  })

  it('still renders when the portfolio request fails', async () => {
    server.use(http.get(`${API_BASE_URL}/portfolio`, fail))
    renderWithProviders(<PortfolioPage />)

    expect(await screen.findByText('The server returned an error.')).toBeInTheDocument()
    expect(await tableRows()).toHaveLength(3)
  })

  it('shows the same values on mobile cards', async () => {
    renderWithProviders(<PortfolioPage />)
    await within(section()).findByRole('table')

    const cards = within(section()).getAllByRole('article')
    expect(cards).toHaveLength(3)
    const card = cards[2]
    if (!card) throw new Error('No card for the oldest order')
    expect(text(card)).toContain('DYCA')
    expect(text(card)).toContain('RejectedREJECTED')
    expect(within(card).getByText('Date').nextElementSibling).toHaveTextContent(
      'Nov 10, 2026, 2:05 PM',
    )
    expect(within(card).getByText('Side').nextElementSibling).toHaveTextContent('Buy')
    expect(within(card).getByText('Type').nextElementSibling).toHaveTextContent('Limit')
    expect(within(card).getByText('Quantity').nextElementSibling).toHaveTextContent('20')
    expect(text(within(card).getByText('Price').nextElementSibling)).toBe('ARS 48.50')
    expect(text(within(card).getByText('Total').nextElementSibling)).toBe('ARS 970.00')
    // The ticker is not a heading: position cards own the <h3> tickers.
    expect(within(card).queryByRole('heading')).not.toBeInTheDocument()
  })

  it('collapses and expands the list from the heading button', async () => {
    renderWithProviders(<PortfolioPage />)
    await tableRows()
    const toggle = within(section()).getByRole('button', { name: 'Placed orders' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(within(section()).queryByRole('table')).not.toBeInTheDocument()
    // The heading and count stay visible while collapsed.
    expect(within(section()).getByText('3 orders')).toBeVisible()

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(within(section()).getByRole('table')).toBeInTheDocument()
  })

  it('renders Spanish copy and formatting', async () => {
    renderWithProviders(<PortfolioPage />, { lang: 'es' })

    expect(await tableRows('Órdenes enviadas')).toEqual([
      [
        '12 nov 2026, 1:53 a. m.',
        'DYCA',
        'Venta',
        'Mercado',
        '3',
        '$ 50,07',
        '$ 150,21',
        'EjecutadaFILLED',
      ],
      [
        '11 nov 2026, 9:30 a. m.',
        'CAPX',
        'Compra',
        'Mercado',
        '10',
        '$ 49,71',
        '$ 497,10',
        'EjecutadaFILLED',
      ],
      [
        '10 nov 2026, 2:05 p. m.',
        'DYCA',
        'Compra',
        'Límite',
        '20',
        '$ 48,50',
        '$ 970,00',
        'RechazadaREJECTED',
      ],
    ])
    const table = within(section('Órdenes enviadas')).getByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'Operación' })).toBeInTheDocument()
    expect(within(section('Órdenes enviadas')).getByText('3 órdenes')).toBeInTheDocument()
  })
})
