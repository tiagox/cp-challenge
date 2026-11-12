import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { useOrderTicket, type OpenOrderTicketInput } from '@/features/order'
import { API_BASE_URL } from '@/shared/api/config'
import { dyca } from '@/test/fixtures/instruments'
import { portfolioFixture } from '@/test/fixtures/portfolio'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { OrderModalContainer } from './OrderModalContainer'

const portfolioUrl = `${API_BASE_URL}/portfolio`

function Opener({ input }: { input: OpenOrderTicketInput }) {
  const { open } = useOrderTicket()
  return <button onClick={() => open(input)}>open ticket</button>
}

function renderContainer(input: OpenOrderTicketInput = { instrument: dyca }) {
  const user = userEvent.setup()
  renderWithProviders(
    <>
      <Opener input={input} />
      <OrderModalContainer />
    </>,
  )
  return { user, openTicket: () => user.click(screen.getByRole('button', { name: 'open ticket' })) }
}

describe('OrderModalContainer', () => {
  it('renders nothing while the ticket is closed', () => {
    renderContainer()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the modal with the selected instrument, side and portfolio data', async () => {
    const { openTicket } = renderContainer({ instrument: dyca, side: 'SELL', quantity: 4 })
    await openTicket()

    expect(screen.getByRole('dialog', { name: 'Sell DYCA' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Quantity (shares)')).toHaveValue(4)
    expect(screen.getByText('Available shares').nextElementSibling).toHaveTextContent(
      String(portfolioFixture.holdings[0]?.quantity),
    )
  })

  it('shows a spinner while the portfolio is pending', async () => {
    server.use(http.get(portfolioUrl, () => delay('infinite')))
    const { openTicket } = renderContainer()
    await openTicket()

    expect(within(screen.getByRole('dialog')).getByRole('status')).toHaveTextContent('Loading...')
  })

  it('shows the portfolio error and retries it', async () => {
    server.use(http.get(portfolioUrl, () => HttpResponse.json({}, { status: 500 })))
    const { user, openTicket } = renderContainer()
    await openTicket()

    const retry = await screen.findByRole('button', { name: 'Retry' })
    // The retry refetches; the default handler now answers with the fixture.
    server.resetHandlers()
    await user.click(retry)
    expect(await screen.findByLabelText('Quantity (shares)')).toBeInTheDocument()
  })

  it('closes the modal through close()', async () => {
    const { user, openTicket } = renderContainer()
    await openTicket()

    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
