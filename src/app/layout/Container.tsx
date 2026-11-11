import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Container.module.scss'

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(styles.container, className)}>{children}</div>
}
