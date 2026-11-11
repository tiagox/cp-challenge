import { useOrderTicket } from '@/features/order'

/**
 * Composition point for the order ticket (spec 06): reads the ticket state, looks up the
 * portfolio through the portfolio feature's public hook and renders the order feature's modal.
 * It lives in `app` so `features/order` never imports `features/portfolio`.
 */
export function OrderModalContainer() {
  // Subscribes now so spec 06 only replaces the body.
  useOrderTicket()
  return null
}
