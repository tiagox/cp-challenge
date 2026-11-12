import { useTranslation } from 'react-i18next'
import { marketValue, profitLoss, returnOnCost } from '@/entities/position/model/metrics'
import type { Holding } from '@/entities/position/model/types'
import { useFormat } from '@/shared/i18n/useFormat'
import { Button } from '@/shared/ui/Button'
import { MoneyText } from '@/shared/ui/MoneyText'
import { PercentText } from '@/shared/ui/PercentText'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'
import styles from './PositionsTable.module.scss'

export interface PositionsTableProps {
  holdings: Holding[]
  onSelect: (holding: Holding) => void
}

/** Desktop list (>= 768px); hidden below by CSS. */
export function PositionsTable({ holdings, onSelect }: PositionsTableProps) {
  const { t } = useTranslation()
  const { quantity } = useFormat()

  return (
    <table className={styles.table}>
      <caption>
        <VisuallyHidden>{t('portfolio.positions.title')}</VisuallyHidden>
      </caption>
      <thead>
        <tr>
          <th scope="col">{t('portfolio.columns.ticker')}</th>
          <th scope="col" className={styles.numeric}>
            {t('portfolio.columns.quantity')}
          </th>
          <th scope="col" className={styles.numeric}>
            {t('portfolio.columns.marketValue')}
          </th>
          <th scope="col" className={styles.numeric}>
            {t('portfolio.columns.profitLoss')}
          </th>
          <th scope="col" className={styles.numeric}>
            {t('portfolio.columns.return')}
          </th>
          <th scope="col" className={styles.action}>
            <VisuallyHidden>{t('portfolio.columns.action')}</VisuallyHidden>
          </th>
        </tr>
      </thead>
      <tbody>
        {holdings.map((holding) => {
          const ticker =
            holding.ticker ??
            t('portfolio.positions.unknownInstrument', { id: holding.instrument_id })
          return (
            <tr key={holding.instrument_id} className={styles.row}>
              <th scope="row" className={styles.ticker}>
                {ticker}
              </th>
              <td className={styles.numeric}>
                {quantity(holding.quantity) ?? t('common.notAvailable')}
              </td>
              <td className={styles.numeric}>
                <MoneyText value={marketValue(holding.quantity, holding.last_price)} />
              </td>
              <td className={styles.numeric}>
                <MoneyText
                  value={profitLoss(holding.quantity, holding.last_price, holding.avg_cost_price)}
                  signed
                />
              </td>
              <td className={styles.numeric}>
                <PercentText value={returnOnCost(holding.last_price, holding.avg_cost_price)} />
              </td>
              <td className={styles.action}>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={t('portfolio.actions.sellTicker', { ticker })}
                  onClick={() => onSelect(holding)}
                >
                  {t('portfolio.actions.sell')}
                </Button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
