import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n/useFormat'
import { cx } from '@/shared/lib/cx'
import styles from './MoneyText.module.scss'

export interface MoneyTextProps {
  value: number | null | undefined
  signed?: boolean
  tone?: 'default' | 'positive' | 'negative'
  className?: string
}

export function MoneyText({ value, signed = false, tone = 'default', className }: MoneyTextProps) {
  const { t } = useTranslation()
  const { currency } = useFormat()

  return (
    <span className={cx(styles.money, styles[tone], className)}>
      {currency(value, { signed }) ?? t('common.notAvailable')}
    </span>
  )
}
