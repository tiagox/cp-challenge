import { useTranslation } from 'react-i18next'
import { returnPercent } from '@/entities/instrument/model/metrics'
import type { Instrument } from '@/entities/instrument/model/types'
import { Button } from '@/shared/ui/Button'
import { MoneyText } from '@/shared/ui/MoneyText'
import { PercentText } from '@/shared/ui/PercentText'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'
import { InstrumentTypeBadge } from './InstrumentTypeBadge'
import styles from './InstrumentsTable.module.scss'

export interface InstrumentsTableProps {
  instruments: Instrument[]
  onSelect: (instrument: Instrument) => void
}

/** Desktop list (>= 768px); hidden below by CSS. */
export function InstrumentsTable({ instruments, onSelect }: InstrumentsTableProps) {
  const { t } = useTranslation()

  return (
    <table className={styles.table}>
      <caption>
        <VisuallyHidden>{t('instruments.title')}</VisuallyHidden>
      </caption>
      <thead>
        <tr>
          <th scope="col">{t('instruments.columns.ticker')}</th>
          <th scope="col">{t('instruments.columns.name')}</th>
          <th scope="col" className={styles.numeric}>
            {t('instruments.columns.lastPrice')}
          </th>
          <th scope="col" className={styles.numeric}>
            {t('instruments.columns.return')}
          </th>
          <th scope="col" className={styles.action}>
            <VisuallyHidden>{t('instruments.columns.action')}</VisuallyHidden>
          </th>
        </tr>
      </thead>
      <tbody>
        {instruments.map((instrument) => (
          <tr key={instrument.id} className={styles.row}>
            <th scope="row" className={styles.ticker}>
              <span className={styles.tickerCell}>
                {instrument.ticker}
                <InstrumentTypeBadge type={instrument.type} />
              </span>
            </th>
            <td className={styles.name}>{instrument.name}</td>
            <td className={styles.numeric}>
              <MoneyText value={instrument.last_price} />
            </td>
            <td className={styles.numeric}>
              <PercentText
                value={returnPercent(instrument.last_price, instrument.close_price)}
                tone="auto"
              />
            </td>
            <td className={styles.action}>
              <Button size="sm" onClick={() => onSelect(instrument)}>
                {t('instruments.actions.trade')}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
