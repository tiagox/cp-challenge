import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from '@/shared/lib/cx'
import { Spinner } from '../Spinner'
import styles from './Button.module.scss'

export type ButtonVariant = 'primary' | 'secondary'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
  leftIcon?: ReactNode
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
    >
      {isLoading ? <Spinner size="sm" /> : leftIcon}
      {children}
    </button>
  )
}
