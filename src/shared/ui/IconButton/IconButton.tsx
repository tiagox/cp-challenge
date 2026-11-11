import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './IconButton.module.scss'

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children'
> {
  /** Accessible name; the button has no visible text. */
  label: string
  icon: ReactNode
  size?: 'sm' | 'md'
  variant?: 'outline' | 'ghost'
  ref?: Ref<HTMLButtonElement>
}

export function IconButton({
  label,
  icon,
  size = 'md',
  variant = 'outline',
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      title={label}
      className={cx(styles.button, styles[size], styles[variant], className)}
    >
      {icon}
    </button>
  )
}
