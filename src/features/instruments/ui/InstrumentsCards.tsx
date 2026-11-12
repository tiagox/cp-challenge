import { useTranslation } from 'react-i18next'
import { returnPercent } from '@/entities/instrument/model/metrics'
import type { Instrument } from '@/entities/instrument/model/types'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { MoneyText } from '@/shared/ui/MoneyText'
import { PercentText } from '@/shared/ui/PercentText'
import { InstrumentTypeBadge } from './InstrumentTypeBadge'
import styles from './InstrumentsCards.module.scss'

export interface InstrumentsCardsProps {
  instruments: Instrument[]
  onSelect: (instrument: Instrument) => void
}

/** Mobile list (< 768px); hidden above by CSS. */
export function InstrumentsCards({ instruments, onSelect }: InstrumentsCardsProps) {
  const { t } = useTranslation()

  return (
    <ul className={styles.list}>
      {instruments.map((instrument) => (
        <li key={instrument.id}>
          <Card as="article" className={styles.card}>
            <div className={styles.top}>
              <div className={styles.identity}>
                <h2 className={styles.ticker}>
                  {instrument.ticker}
                  <InstrumentTypeBadge type={instrument.type} />
                </h2>
                <p className={styles.name}>{instrument.name}</p>
              </div>
              <div className={styles.prices}>
                <MoneyText value={instrument.last_price} className={styles.price} />
                <PercentText value={returnPercent(instrument.last_price, instrument.close_price)} />
              </div>
            </div>
            <Button fullWidth onClick={() => onSelect(instrument)}>
              {t('instruments.actions.trade')}
            </Button>
          </Card>
        </li>
      ))}
    </ul>
  )
}
