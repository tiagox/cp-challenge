import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Badge.module.scss'

export type BadgeVariant = 'neutral' | 'positive' | 'negative' | 'warning' | 'info'

export interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  icon?: ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', children, icon, className }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[variant], className)}>
      {icon}
      {children}
    </span>
  )
}
