import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n/useFormat'
import { cx } from '@/shared/lib/cx'
import { signTone } from '@/shared/lib/math'
import styles from './PercentText.module.scss'

/** Signed percentage colored by its sign (zero stays neutral). */
export function PercentText({ value }: { value: number | null | undefined }) {
  const { t } = useTranslation()
  const { percent } = useFormat()

  return (
    <span className={cx(styles.percent, styles[signTone(value)])}>
      {percent(value, { signed: true }) ?? t('common.notAvailable')}
    </span>
  )
}
