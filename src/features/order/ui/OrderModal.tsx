import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Holding } from '@/entities/position/model/types'
import type { CreateOrderRequest, OrderSide } from '@/shared/api/types'
import { Button } from '@/shared/ui/Button'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Modal } from '@/shared/ui/Modal'
import { Spinner } from '@/shared/ui/Spinner'
import { useCreateOrder } from '../mutations'
import type { OrderInstrument } from '../model/OrderTicketContext'
import { OrderForm } from './OrderForm'
import styles from './OrderModal.module.scss'
import { OrderResult } from './OrderResult'

export interface OrderModalProps {
  instrument: OrderInstrument
  initialSide: OrderSide
  initialQuantity?: number
  cash: number | undefined
  holdings: Holding[] | undefined
  /** Set when the portfolio query failed; `cash` is then undefined. */
  portfolioError: unknown
  onRetryPortfolio: () => void
  onClose: () => void
}

export function OrderModal({
  instrument,
  initialSide,
  initialQuantity,
  cash,
  holdings,
  portfolioError,
  onRetryPortfolio,
  onClose,
}: OrderModalProps) {
  const { t } = useTranslation()
  const formId = useId()
  const [side, setSide] = useState(initialSide)
  const mutation = useCreateOrder()
  const submitted = useRef(false)

  const availableShares =
    holdings?.find((holding) => holding.instrument_id === instrument.id)?.quantity ?? 0

  // `isPending` only flips on the next render, so a fast double-click could submit twice.
  // The ticket places one order per opening, so a ref blocks every later submit.
  const submit = (payload: CreateOrderRequest) => {
    if (submitted.current) return
    submitted.current = true
    mutation.mutate(payload)
  }

  const closeButton = (
    <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
      {t(mutation.isIdle || mutation.isPending ? 'orders.actions.cancel' : 'orders.actions.close')}
    </Button>
  )

  // The result wins over portfolio state: the refetch it triggers may fail without hiding it.
  let body
  let result
  let footer = closeButton
  if (mutation.isSuccess || mutation.isError) {
    result = mutation.isSuccess ? (
      <OrderResult order={mutation.data} />
    ) : (
      <OrderResult error={mutation.error} />
    )
  } else if (cash !== undefined) {
    body = (
      <OrderForm
        id={formId}
        instrument={instrument}
        side={side}
        initialQuantity={initialQuantity}
        cash={cash}
        availableShares={availableShares}
        onSubmit={submit}
        onSideChange={setSide}
      />
    )
    footer = (
      <>
        {closeButton}
        <Button
          type="submit"
          form={formId}
          isLoading={mutation.isPending}
          disabled={!(instrument.last_price > 0)}
        >
          {t(
            mutation.isPending
              ? 'orders.actions.submitting'
              : side === 'BUY'
                ? 'orders.actions.submitBuy'
                : 'orders.actions.submitSell',
          )}
        </Button>
      </>
    )
  } else if (portfolioError) {
    body = <ErrorState error={portfolioError} onRetry={onRetryPortfolio} />
  } else {
    body = (
      <div className={styles.loading}>
        <Spinner />
      </div>
    )
  }

  return (
    <Modal
      open
      // Esc, overlay click and the header X all land here; none may close mid-request.
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose()
      }}
      title={t(side === 'BUY' ? 'orders.title.buy' : 'orders.title.sell', {
        ticker: instrument.ticker,
      })}
      description={t('orders.description')}
      footer={footer}
    >
      {body}
      {/* Always mounted: screen readers only announce changes inside an existing live region. */}
      <div aria-live="polite">{result}</div>
    </Modal>
  )
}
