import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/shared/api/config'
import { queryKeys } from '@/shared/api/queryKeys'
import type { AppLocale } from '@/shared/i18n/types'
import { dyca } from '@/test/fixtures/instruments'
import { pendingLimitOrder } from '@/test/fixtures/orders'
import { portfolioFixture } from '@/test/fixtures/portfolio'
import { captureOrders } from '@/test/helpers'
import { createTestQueryClient, renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { OrderModal, type OrderModalProps } from './index'

const ordersUrl = `${API_BASE_URL}/orders`

function renderModal(
  props: Partial<OrderModalProps> = {},
  options: { lang?: AppLocale; queryClient?: QueryClient } = {},
) {
  const onClose = vi.fn()
  const view = renderWithProviders(
    <OrderModal
      instrument={dyca}
      initialSide="BUY"
      cash={portfolioFixture.cash}
      holdings={portfolioFixture.holdings}
      portfolioError={null}
      onRetryPortfolio={vi.fn()}
      onClose={onClose}
      {...props}
    />,
    options,
  )
  return { ...view, onClose, user: userEvent.setup() }
}

const quantity = () => screen.getByLabelText('Quantity (shares)')
const amount = () => screen.getByLabelText('Amount (ARS)')

describe('OrderModal', () => {
  it('renders the title, fields and available cash', () => {
    renderModal()

    expect(screen.getByRole('dialog', { name: 'Buy DYCA' })).toBeInTheDocument()
    expect(quantity()).toHaveAttribute('step', '1')
    expect(amount()).toBeInTheDocument()
    expect(screen.getByText('Available cash').nextElementSibling).toHaveTextContent(
      'ARS 1,000,000.00',
    )
  })

  it('hides the limit price for MARKET and shows it for LIMIT', async () => {
    const { user } = renderModal()
    expect(screen.queryByLabelText('Limit price')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Limit'))

    expect(screen.getByLabelText('Limit price')).toHaveValue(50.07)
  })

  it('derives the amount from the quantity', async () => {
    const { user } = renderModal()
    await user.type(quantity(), '3')

    expect(amount()).toHaveValue(150.21)
    expect(screen.getByText('Estimated total').nextElementSibling).toHaveTextContent('ARS 150.21')
  })

  it('derives whole shares from the amount', async () => {
    const { user } = renderModal()
    await user.type(amount(), '160.5')

    expect(quantity()).toHaveValue(3)
    expect(amount()).toHaveValue(160.5)
  })

  it('fills quantity and amount from a SELL preset', () => {
    renderModal({ initialSide: 'SELL', initialQuantity: 10 })

    expect(screen.getByRole('dialog', { name: 'Sell DYCA' })).toBeInTheDocument()
    expect(quantity()).toHaveValue(10)
    expect(amount()).toHaveValue(500.7)
    expect(screen.getByText('Available shares').nextElementSibling).toHaveTextContent('10')
  })

  it('disables Sell without a position in the instrument', () => {
    renderModal({ holdings: [] })

    expect(screen.getByLabelText('Sell')).toBeDisabled()
    expect(screen.getByLabelText('Buy')).toBeEnabled()
  })

  it('caps a SELL quantity at the shares held', async () => {
    const { user } = renderModal({ initialSide: 'SELL' })

    await user.type(quantity(), '15')
    expect(quantity()).toHaveValue(10)
    expect(amount()).toHaveValue(500.7)

    await user.clear(amount())
    await user.type(amount(), '1000')
    expect(quantity()).toHaveValue(10)
  })

  it('caps the quantity when switching from Buy to Sell', async () => {
    const { user } = renderModal()
    await user.type(quantity(), '25')

    await user.click(screen.getByLabelText('Sell'))

    expect(quantity()).toHaveValue(10)
    expect(amount()).toHaveValue(500.7)
  })

  it('shows localized errors on an invalid submit without calling the API', async () => {
    const bodies = captureOrders()
    const { user } = renderModal()

    await user.click(screen.getByRole('button', { name: 'Buy' }))

    expect(await screen.findByText('Enter a quantity.')).toBeInTheDocument()
    expect(quantity()).toHaveFocus()
    expect(bodies).toHaveLength(0)
  })

  it('sends a MARKET BUY payload without a price', async () => {
    const bodies = captureOrders()
    const { user } = renderModal()

    await user.type(quantity(), '3')
    await user.click(screen.getByRole('button', { name: 'Buy' }))

    await screen.findByText('Order #648128')
    expect(bodies).toEqual([{ instrument_id: 1, side: 'BUY', type: 'MARKET', quantity: 3 }])
  })

  it('sends a LIMIT BUY payload with the price', async () => {
    const bodies = captureOrders()
    const { user } = renderModal()

    await user.click(screen.getByLabelText('Limit'))
    await user.type(quantity(), '2')
    await user.clear(screen.getByLabelText('Limit price'))
    await user.type(screen.getByLabelText('Limit price'), '48.5')
    await user.click(screen.getByRole('button', { name: 'Buy' }))

    await screen.findByText('Order #648128')
    expect(bodies).toEqual([
      { instrument_id: 1, side: 'BUY', type: 'LIMIT', quantity: 2, price: 48.5 },
    ])
  })

  it('shows the order id and the translated status with its raw code', async () => {
    const { user } = renderModal()
    // The live region must exist before the result arrives, or it is not announced.
    const liveRegion = document.querySelector('[aria-live="polite"]')
    await user.type(quantity(), '1')
    await user.click(screen.getByRole('button', { name: 'Buy' }))

    expect(await screen.findByText('Order #648128')).toBeInTheDocument()
    expect(liveRegion).toHaveTextContent('Order #648128')
    expect(screen.getByText('Filled')).toHaveTextContent('FilledFILLED')
    expect(screen.getByText('Order filled successfully.')).toBeInTheDocument()
  })

  it('shows the pending message', async () => {
    server.use(http.post(ordersUrl, () => HttpResponse.json(pendingLimitOrder, { status: 201 })))
    const { user } = renderModal()
    await user.type(quantity(), '1')
    await user.click(screen.getByRole('button', { name: 'Buy' }))

    expect(await screen.findByText('Order submitted. It is pending execution.')).toBeInTheDocument()
  })

  it('shows a localized rejection without an id for a 400', async () => {
    server.use(
      http.post(ordersUrl, () =>
        HttpResponse.json({ error: 'Insufficient cash' }, { status: 400 }),
      ),
    )
    const { user } = renderModal()
    await user.type(quantity(), '1')
    await user.click(screen.getByRole('button', { name: 'Buy' }))

    expect(await screen.findByText('The order exceeds your available cash.')).toBeInTheDocument()
    expect(screen.getByText('Order rejected.')).toBeInTheDocument()
    expect(screen.queryByText(/Order #/)).not.toBeInTheDocument()
  })

  it('sends a single request on a double click', async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(ordersUrl, async ({ request }) => {
        bodies.push(await request.clone().json())
        await delay(50)
      }),
    )
    const { user } = renderModal()
    await user.type(quantity(), '1')

    await user.dblClick(screen.getByRole('button', { name: 'Buy' }))
    expect(screen.getByRole('button', { name: /Submitting/ })).toBeDisabled()

    await screen.findByText('Order #648128')
    expect(bodies).toHaveLength(1)
  })

  it('cannot be closed while the order request is pending', async () => {
    server.use(http.post(ordersUrl, () => delay(50)))
    const { user, onClose } = renderModal()
    await user.type(quantity(), '1')
    await user.click(screen.getByRole('button', { name: 'Buy' }))

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).not.toHaveBeenCalled()

    await screen.findByText('Order #648128')
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('does not retry a failed order', async () => {
    let calls = 0
    server.use(
      http.post(ordersUrl, () => {
        calls += 1
        return HttpResponse.json({ error: 'boom' }, { status: 503 })
      }),
    )
    // The default would retry; the mutation's own `retry: false` must win.
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: 3, retryDelay: 0 } },
    })
    const { user } = renderModal({}, { queryClient })
    await user.type(quantity(), '1')
    await user.click(screen.getByRole('button', { name: 'Buy' }))

    expect(await screen.findByText('The server returned an error.')).toBeInTheDocument()
    expect(calls).toBe(1)
  })

  it('invalidates the portfolio after a successful order', async () => {
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { user } = renderModal({}, { queryClient })

    await user.type(quantity(), '1')
    await user.click(screen.getByRole('button', { name: 'Buy' }))
    await screen.findByText('Order #648128')

    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.portfolio })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.orders })
  })

  it('offers only Close after a result', async () => {
    const { user, onClose } = renderModal()
    await user.type(quantity(), '1')
    await user.click(screen.getByRole('button', { name: 'Buy' }))
    await screen.findByText('Order #648128')

    expect(screen.queryByRole('button', { name: 'New order' })).not.toBeInTheDocument()
    // The header's X icon button is also named "Close"; this is the footer one.
    await user.click(screen.getByText('Close', { selector: 'button' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders Spanish copy', async () => {
    const { user } = renderModal({}, { lang: 'es' })

    expect(screen.getByRole('dialog', { name: 'Comprar DYCA' })).toBeInTheDocument()
    expect(screen.getByText('Efectivo disponible').nextElementSibling).toHaveTextContent(
      '$ 1.000.000,00',
    )
    await user.click(screen.getByRole('button', { name: 'Comprar' }))
    expect(await screen.findByText('Ingresá una cantidad.')).toBeInTheDocument()
  })

  it('disables submit when the last price is unavailable', () => {
    renderModal({ instrument: { ...dyca, last_price: 0 } })

    expect(screen.getByText('The last price is unavailable. Try again later.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buy' })).toBeDisabled()
  })

  it('shows the LIMIT amount hint and still derives shares from the last price', async () => {
    const { user } = renderModal()
    await user.click(screen.getByLabelText('Limit'))
    await user.clear(screen.getByLabelText('Limit price'))
    await user.type(screen.getByLabelText('Limit price'), '10')
    await user.type(amount(), '160.5')

    expect(screen.getByText(/so the estimated total at your limit price may differ/)).toBeVisible()
    expect(quantity()).toHaveValue(3)
    expect(screen.getByText('Estimated total').nextElementSibling).toHaveTextContent('ARS 30.00')
  })
})
