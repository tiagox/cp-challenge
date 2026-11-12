import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { CreateOrderRequest, OrderSide, OrderType } from '@/shared/api/types'
import { useFormat } from '@/shared/i18n/useFormat'
import { Input } from '@/shared/ui/Input'
import { MoneyText } from '@/shared/ui/MoneyText'
import { SegmentedControl } from '@/shared/ui/SegmentedControl'
import { amountFromQuantity, quantityFromAmount } from '../model/linkedFields'
import type { OrderInstrument } from '../model/OrderTicketContext'
import { validateOrder, type OrderValidationCode } from '../model/validation'
import styles from './OrderForm.module.scss'

const errorKeys = {
  QUANTITY_REQUIRED: 'validation.quantityRequired',
  QUANTITY_INTEGER: 'validation.quantityInteger',
  QUANTITY_MIN: 'validation.quantityMin',
  PRICE_REQUIRED: 'validation.priceRequired',
  PRICE_POSITIVE: 'validation.pricePositive',
  INSUFFICIENT_CASH: 'validation.insufficientCash',
  INSUFFICIENT_SHARES: 'validation.insufficientShares',
  LAST_PRICE_UNAVAILABLE: 'validation.lastPriceUnavailable',
  NO_HOLDING: 'validation.noHolding',
} as const satisfies Record<OrderValidationCode, string>

function parse(value: string): number | null {
  if (value.trim() === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const toInput = (value: number | null) => (value === null ? '' : String(value))

export interface OrderFormProps {
  id: string
  instrument: OrderInstrument
  /** Owned by the modal, which also shows it in the title and the submit label. */
  side: OrderSide
  initialQuantity?: number
  cash: number
  availableShares: number
  onSubmit: (payload: CreateOrderRequest) => void
  onSideChange: (side: OrderSide) => void
}

export function OrderForm({
  id,
  instrument,
  side,
  initialQuantity,
  cash,
  availableShares,
  onSubmit,
  onSideChange,
}: OrderFormProps) {
  const { t } = useTranslation()
  const { quantity: formatQuantity } = useFormat()
  const lastPrice = instrument.last_price

  const [type, setType] = useState<OrderType>('MARKET')
  const [quantity, setQuantity] = useState(toInput(initialQuantity ?? null))
  const [amount, setAmount] = useState(() =>
    initialQuantity ? toInput(amountFromQuantity(initialQuantity, lastPrice)) : '',
  )
  const [limitPrice, setLimitPrice] = useState(String(lastPrice))
  const [submitted, setSubmitted] = useState(false)
  const quantityRef = useRef<HTMLInputElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)

  const validation = validateOrder({
    side,
    type,
    quantity: parse(quantity),
    limitPrice: parse(limitPrice),
    lastPrice,
    cash,
    availableShares,
  })
  const shownErrors = submitted ? validation.errors : {}
  const errorText = (code: OrderValidationCode | undefined) =>
    code ? t(errorKeys[code]) : undefined

  // A SELL can never ask for more shares than the position holds.
  const capShares = (shares: number | null, forSide: OrderSide) =>
    forSide === 'SELL' && shares !== null && shares > availableShares ? availableShares : shares

  // Each field derives the other only on its own change, so the field being typed in never moves.
  const changeQuantity = (value: string, forSide = side) => {
    const parsed = parse(value)
    const shares = capShares(parsed, forSide)
    setQuantity(shares === parsed ? value : toInput(shares))
    setAmount(shares === null ? '' : toInput(amountFromQuantity(shares, lastPrice)))
  }

  const changeAmount = (value: string) => {
    setAmount(value)
    const parsed = parse(value)
    const shares = parsed === null ? null : quantityFromAmount(parsed, lastPrice)
    setQuantity(toInput(capShares(shares, side)))
  }

  const changeSide = (next: OrderSide) => {
    onSideChange(next)
    changeQuantity(quantity, next)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validation.valid) {
      setSubmitted(true)
      if (validation.errors.quantity) quantityRef.current?.focus()
      else if (validation.errors.price) priceRef.current?.focus()
      return
    }
    const base = { instrument_id: instrument.id, side, quantity: validation.quantity }
    onSubmit(
      type === 'LIMIT'
        ? { ...base, type, price: validation.effectivePrice }
        : { ...base, type: 'MARKET' },
    )
  }

  const formError = shownErrors.form === 'LAST_PRICE_UNAVAILABLE' ? undefined : shownErrors.form

  return (
    <form id={id} className={styles.form} onSubmit={handleSubmit} noValidate>
      <SegmentedControl
        className={styles.toggle}
        label={t('orders.side.label')}
        value={side}
        onChange={changeSide}
        options={[
          { value: 'BUY', label: t('orders.side.BUY') },
          { value: 'SELL', label: t('orders.side.SELL'), disabled: availableShares <= 0 },
        ]}
      />

      {lastPrice > 0 ? null : (
        <p className={styles.alert} role="alert">
          {t('orders.errors.lastPriceUnavailable')}
        </p>
      )}

      <div className={styles.fields}>
        <Input
          ref={quantityRef}
          label={t('orders.fields.quantity')}
          type="number"
          step="1"
          min="1"
          max={side === 'SELL' ? availableShares : undefined}
          inputMode="numeric"
          value={quantity}
          onChange={(event) => changeQuantity(event.target.value)}
          error={errorText(shownErrors.quantity)}
        />
        <Input
          label={t('orders.fields.amount')}
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          value={amount}
          onChange={(event) => changeAmount(event.target.value)}
          hint={t(type === 'LIMIT' ? 'orders.hints.amountLimit' : 'orders.hints.amount')}
        />
      </div>

      <SegmentedControl
        className={styles.toggle}
        label={t('orders.type.label')}
        value={type}
        onChange={setType}
        options={[
          { value: 'MARKET', label: t('orders.type.MARKET') },
          { value: 'LIMIT', label: t('orders.type.LIMIT') },
        ]}
      />

      {type === 'LIMIT' ? (
        <Input
          ref={priceRef}
          label={t('orders.fields.limitPrice')}
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          value={limitPrice}
          onChange={(event) => setLimitPrice(event.target.value)}
          hint={t('orders.hints.limit')}
          error={errorText(shownErrors.price)}
        />
      ) : null}

      {formError ? (
        <p className={styles.alert} role="alert">
          {errorText(formError)}
        </p>
      ) : null}

      <dl className={styles.summary}>
        <div className={styles.row}>
          <dt>
            {t(side === 'BUY' ? 'orders.fields.availableCash' : 'orders.fields.availableShares')}
          </dt>
          <dd>{side === 'BUY' ? <MoneyText value={cash} /> : formatQuantity(availableShares)}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('orders.fields.estimatedTotal')}</dt>
          <dd className={styles.total}>
            <MoneyText value={validation.estimatedTotal} />
          </dd>
        </div>
      </dl>
    </form>
  )
}
