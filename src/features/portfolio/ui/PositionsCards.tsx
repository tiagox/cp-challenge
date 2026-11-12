import { useTranslation } from 'react-i18next'
import { marketValue, profitLoss, returnOnCost } from '@/entities/position/model/metrics'
import type { Holding } from '@/entities/position/model/types'
import { useFormat } from '@/shared/i18n/useFormat'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { MoneyText } from '@/shared/ui/MoneyText'
import { PercentText } from '@/shared/ui/PercentText'
import styles from './PositionsCards.module.scss'

export interface PositionsCardsProps {
  holdings: Holding[]
  onSelect: (holding: Holding) => void
}

/** Mobile list (< 768px); hidden above by CSS. */
export function PositionsCards({ holdings, onSelect }: PositionsCardsProps) {
  const { t } = useTranslation()
  const { quantity } = useFormat()

  return (
    <ul className={styles.list}>
      {holdings.map((holding) => {
        const ticker =
          holding.ticker ??
          t('portfolio.positions.unknownInstrument', { id: holding.instrument_id })
        return (
          <li key={holding.instrument_id}>
            <Card as="article" className={styles.card}>
              <h3 className={styles.ticker}>{ticker}</h3>
              <dl className={styles.metrics}>
                <div>
                  <dt>{t('portfolio.columns.quantity')}</dt>
                  <dd>{quantity(holding.quantity) ?? t('common.notAvailable')}</dd>
                </div>
                <div>
                  <dt>{t('portfolio.columns.marketValue')}</dt>
                  <dd>
                    <MoneyText value={marketValue(holding.quantity, holding.last_price)} />
                  </dd>
                </div>
                <div>
                  <dt>{t('portfolio.columns.profitLoss')}</dt>
                  <dd>
                    <MoneyText
                      value={profitLoss(
                        holding.quantity,
                        holding.last_price,
                        holding.avg_cost_price,
                      )}
                      signed
                    />
                  </dd>
                </div>
                <div>
                  <dt>{t('portfolio.columns.return')}</dt>
                  <dd>
                    <PercentText value={returnOnCost(holding.last_price, holding.avg_cost_price)} />
                  </dd>
                </div>
              </dl>
              <Button
                fullWidth
                variant="secondary"
                aria-label={t('portfolio.actions.sellTicker', { ticker })}
                onClick={() => onSelect(holding)}
              >
                {t('portfolio.actions.sell')}
              </Button>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
