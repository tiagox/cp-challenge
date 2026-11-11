import type { HTMLAttributes } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './VisuallyHidden.module.scss'

/** Content for assistive technology only. */
export function VisuallyHidden({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...rest} className={cx(styles.root, className)} />
}
