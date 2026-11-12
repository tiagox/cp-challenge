import { useTranslation } from 'react-i18next'
import { orderTotal } from '@/entities/order/model/metrics'
import type { Order } from '@/shared/api/types'
import { useFormat } from '@/shared/i18n/useFormat'
import { MoneyText } from '@/shared/ui/MoneyText'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'
import { OrderStatusBadge } from './OrderStatusBadge'
import styles from './PlacedOrdersTable.module.scss'

export interface PlacedOrdersProps {
  orders: Order[]
  /** instrument_id → ticker. Missing ids render `orders.history.unknownInstrument`. */
  tickers: ReadonlyMap<number, string>
}

/** Desktop list (>= 768px); hidden below by CSS. */
export function PlacedOrdersTable({ orders, tickers }: PlacedOrdersProps) {
  const { t } = useTranslation()
  const { quantity, dateTime } = useFormat()

  return (
    // Eight columns may not fit at 768px: the table scrolls inside this box, not the page.
    <div className={styles.scroller}>
      <table className={styles.table}>
        <caption>
          <VisuallyHidden>{t('orders.history.caption')}</VisuallyHidden>
        </caption>
        <thead>
          <tr>
            <th scope="col">{t('orders.history.columns.date')}</th>
            <th scope="col">{t('orders.history.columns.instrument')}</th>
            <th scope="col">{t('orders.history.columns.side')}</th>
            <th scope="col">{t('orders.history.columns.type')}</th>
            <th scope="col" className={styles.numeric}>
              {t('orders.history.columns.quantity')}
            </th>
            <th scope="col" className={styles.numeric}>
              {t('orders.history.columns.price')}
            </th>
            <th scope="col" className={styles.numeric}>
              {t('orders.history.columns.total')}
            </th>
            <th scope="col">{t('orders.history.columns.status')}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td className={styles.date}>
                <time dateTime={order.created_at}>
                  {dateTime(order.created_at) ?? t('common.notAvailable')}
                </time>
              </td>
              <td className={styles.ticker}>
                {tickers.get(order.instrument_id) ??
                  t('orders.history.unknownInstrument', { id: order.instrument_id })}
              </td>
              <td>{t(`orders.side.${order.side}`)}</td>
              <td>{t(`orders.type.${order.type}`)}</td>
              <td className={styles.numeric}>
                {quantity(order.quantity) ?? t('common.notAvailable')}
              </td>
              <td className={styles.numeric}>
                <MoneyText value={order.price} />
              </td>
              <td className={styles.numeric}>
                <MoneyText value={orderTotal(order)} />
              </td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
