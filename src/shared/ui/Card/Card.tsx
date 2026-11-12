import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Card.module.scss'

export interface CardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'article'
}

export function Card({ children, className, as: Component = 'div' }: CardProps) {
  return <Component className={cx(styles.card, className)}>{children}</Component>
}
