import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n/useFormat'
import { cx } from '@/shared/lib/cx'
import { signTone } from '@/shared/lib/math'
import styles from './MoneyText.module.scss'

export interface MoneyTextProps {
  value: number | null | undefined
  /** Shows `+`/`-` and colors the value by its sign (zero stays neutral). */
  signed?: boolean
  className?: string
}

export function MoneyText({ value, signed = false, className }: MoneyTextProps) {
  const { t } = useTranslation()
  const { currency } = useFormat()

  return (
    <span className={cx(styles.money, signed && styles[signTone(value)], className)}>
      {currency(value, { signed }) ?? t('common.notAvailable')}
    </span>
  )
}
