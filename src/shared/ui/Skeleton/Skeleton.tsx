import type { CSSProperties } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Skeleton.module.scss'

export interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle'
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  className?: string
}

export function Skeleton({ variant = 'text', width, height, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(styles.skeleton, styles[variant], className)}
      style={{ width, height }}
    />
  )
}
