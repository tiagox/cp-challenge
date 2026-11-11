import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n/useFormat'
import { cx } from '@/shared/lib/cx'
import { isFiniteNumber } from '@/shared/lib/math'
import styles from './PercentText.module.scss'

type Tone = 'positive' | 'negative' | 'neutral'

export interface PercentTextProps {
  value: number | null | undefined
  signed?: boolean
  tone?: 'auto' | Tone
  className?: string
}

function autoTone(value: number | null | undefined): Tone {
  if (!isFiniteNumber(value) || value === 0) return 'neutral'
  return value > 0 ? 'positive' : 'negative'
}

export function PercentText({ value, signed = true, tone = 'auto', className }: PercentTextProps) {
  const { t } = useTranslation()
  const { percent } = useFormat()
  const resolvedTone = tone === 'auto' ? autoTone(value) : tone

  return (
    <span className={cx(styles.percent, styles[resolvedTone], className)}>
      {percent(value, { signed }) ?? t('common.notAvailable')}
    </span>
  )
}
