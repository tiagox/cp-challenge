import { OrderModal, useOrderTicket, type OrderInstrument } from '@/features/order'
import type { OrderSide } from '@/shared/api/types'
import { usePortfolio } from '@/features/portfolio'

/**
 * Composition point for the order ticket (spec 06): reads the ticket state, looks up the
 * portfolio through the portfolio feature's public hook and renders the order feature's modal.
 * It lives in `app` so `features/order` never imports `features/portfolio`.
 */
export function OrderModalContainer() {
  const { state, close } = useOrderTicket()
  if (!state.isOpen || !state.instrument) return null

  return (
    <OpenOrderModal
      instrument={state.instrument}
      side={state.presetSide}
      quantity={state.presetQuantity}
      onClose={close}
    />
  )
}

// Split out so the portfolio is only fetched while the ticket is open.
function OpenOrderModal({
  instrument,
  side,
  quantity,
  onClose,
}: {
  instrument: OrderInstrument
  side: OrderSide
  quantity?: number
  onClose: () => void
}) {
  const portfolio = usePortfolio()

  return (
    <OrderModal
      instrument={instrument}
      initialSide={side}
      initialQuantity={quantity}
      cash={portfolio.data?.cash}
      holdings={portfolio.data?.holdings}
      portfolioStatus={portfolio.status}
      onRetryPortfolio={() => void portfolio.refetch()}
      onClose={onClose}
    />
  )
}
