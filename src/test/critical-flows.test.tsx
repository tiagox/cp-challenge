import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/shared/api/config'
import { queryKeys } from '@/shared/api/queryKeys'
import type { CreateOrderRequest } from '@/shared/api/types'
import { pendingLimitOrder } from './fixtures/orders'
import { createTestQueryClient, renderApp } from './render'
import { server } from './server'

const ordersUrl = `${API_BASE_URL}/orders`

/** Records every POST /orders body, then falls through to the default handler. */
function captureOrders() {
  const bodies: CreateOrderRequest[] = []
  server.use(
    http.post(ordersUrl, async ({ request }) => {
      bodies.push((await request.clone().json()) as CreateOrderRequest)
    }),
  )
  return bodies
}

function rowFor(table: HTMLElement, ticker: string) {
  const row = within(table)
    .getByRole('rowheader', { name: new RegExp(`^${ticker}`) })
    .closest('tr')
  if (!row) throw new Error(`No row for ${ticker}`)
  return row
}

async function tradeFrom(ticker: string) {
  const table = await screen.findByRole('table', { name: 'Instruments' })
  await userEvent.click(within(rowFor(table, ticker)).getByRole('button', { name: 'Trade' }))
  return screen.findByRole('dialog')
}

describe('critical flows', () => {
  it('instruments → MARKET BUY → result, invalidating portfolio and orders', async () => {
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const bodies = captureOrders()
    renderApp({ route: '/instruments', queryClient })

    // Loading state before the list arrives.
    expect(await screen.findByRole('status')).toBeInTheDocument()
    const dialog = await tradeFrom('DYCA')

    expect(dialog).toHaveAccessibleName('Buy DYCA')
    expect(within(dialog).getByLabelText('Buy')).toBeChecked()
    expect(within(dialog).getByLabelText('Market')).toBeChecked()

    await userEvent.type(within(dialog).getByLabelText('Quantity (shares)'), '4')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Buy' }))

    expect(await within(dialog).findByText('Order #648128')).toBeInTheDocument()
    expect(within(dialog).getByText('Filled')).toHaveTextContent('FilledFILLED')
    expect(bodies).toEqual([{ instrument_id: 1, side: 'BUY', type: 'MARKET', quantity: 4 }])
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.portfolio })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.orders })
  })

  it('portfolio → Sell preset sends the whole integer position', async () => {
    const bodies = captureOrders()
    renderApp({ route: '/portfolio' })

    // Table and cards both render in jsdom; CSS picks one by width.
    await userEvent.click((await screen.findAllByRole('button', { name: 'Sell DYCA' }))[0]!)
    const dialog = await screen.findByRole('dialog', { name: 'Sell DYCA' })

    expect(within(dialog).getByLabelText('Sell')).toBeChecked()
    expect(within(dialog).getByLabelText('Quantity (shares)')).toHaveValue(10)

    await userEvent.click(within(dialog).getByRole('button', { name: 'Sell' }))

    await within(dialog).findByText('Order #648128')
    expect(bodies).toEqual([{ instrument_id: 1, side: 'SELL', type: 'MARKET', quantity: 10 }])
  })

  it('search → filtered list → Trade opens a BUY ticket, with ?q= in the URL', async () => {
    const { router } = renderApp({ route: '/instruments' })
    await screen.findByRole('table', { name: 'Instruments' })

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search by ticker' }), 'cap')

    expect(await screen.findByText('1 result for “cap”')).toBeInTheDocument()
    const rows = within(screen.getByRole('table', { name: 'Instruments' })).getAllByRole('row')
    expect(rows).toHaveLength(2)
    expect(router.state.location.search).toBe('?q=cap')

    expect(await tradeFrom('CAPX')).toHaveAccessibleName('Buy CAPX')
  })

  it('shows an empty search result', async () => {
    renderApp({ route: '/instruments?q=zzz' })

    expect(await screen.findByRole('heading', { name: 'No instruments found' })).toBeInTheDocument()
  })

  // The result view offers only Close (session 13), so "usable" means close → reopen gives a fresh form.
  it('a 400 rejection shows localized copy, no id, and the ticket can be reopened', async () => {
    server.use(
      http.post(ordersUrl, () =>
        HttpResponse.json({ error: 'Insufficient cash' }, { status: 400 }),
      ),
    )
    renderApp({ route: '/instruments' })
    const dialog = await tradeFrom('DYCA')

    await userEvent.type(within(dialog).getByLabelText('Quantity (shares)'), '1')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Buy' }))

    expect(
      await within(dialog).findByText('The order exceeds your available cash.'),
    ).toBeInTheDocument()
    expect(within(dialog).queryByText(/Order #/)).not.toBeInTheDocument()

    await userEvent.click(within(dialog).getByText('Close', { selector: 'button' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const reopened = await tradeFrom('DYCA')
    expect(within(reopened).getByLabelText('Quantity (shares)')).toBeEnabled()
    expect(within(reopened).getByRole('button', { name: 'Buy' })).toBeEnabled()
  })

  it('LIMIT order sends the price and renders PENDING copy', async () => {
    server.use(http.post(ordersUrl, () => HttpResponse.json(pendingLimitOrder, { status: 201 })))
    const bodies = captureOrders()
    renderApp({ route: '/instruments' })
    const dialog = await tradeFrom('DYCA')

    expect(within(dialog).queryByLabelText('Limit price')).not.toBeInTheDocument()
    await userEvent.click(within(dialog).getByLabelText('Limit'))
    const price = within(dialog).getByLabelText('Limit price')
    await userEvent.clear(price)
    await userEvent.type(price, '48')
    await userEvent.type(within(dialog).getByLabelText('Quantity (shares)'), '2')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Buy' }))

    expect(
      await within(dialog).findByText('Order submitted. It is pending execution.'),
    ).toBeInTheDocument()
    expect(within(dialog).getByText('Pending')).toHaveTextContent('PendingPENDING')
    expect(bodies).toEqual([
      { instrument_id: 1, side: 'BUY', type: 'LIMIT', quantity: 2, price: 48 },
    ])
  })

  it('nav moves between sections and marks the active route', async () => {
    renderApp({ route: '/instruments' })
    await screen.findByRole('heading', { level: 1, name: 'Instruments' })
    const nav = screen.getAllByRole('navigation', { name: 'Main navigation' })[0]!

    await userEvent.click(within(nav).getByRole('link', { name: 'Portfolio' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Portfolio' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Portfolio' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByRole('link', { name: 'Instruments' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('unknown route → not found → link back to instruments', async () => {
    renderApp({ route: '/nope' })

    await userEvent.click(await screen.findByRole('link', { name: 'Go to instruments' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Instruments' }),
    ).toBeInTheDocument()
  })

  it('shows a retryable error when instruments fail', async () => {
    server.use(
      http.get(`${API_BASE_URL}/instruments`, async () => {
        await delay(10)
        return HttpResponse.json({ error: 'boom' }, { status: 500 })
      }),
    )
    renderApp({ route: '/instruments' })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument())
  })
})
