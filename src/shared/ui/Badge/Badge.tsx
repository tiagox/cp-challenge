import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Badge.module.scss'

export type BadgeVariant = 'neutral' | 'positive' | 'negative' | 'warning' | 'info'

export interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return <span className={cx(styles.badge, styles[variant])}>{children}</span>
}
