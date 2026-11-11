import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Input.module.scss'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label: string
  error?: string
  hint?: string
  prefix?: ReactNode
  suffix?: ReactNode
  fullWidth?: boolean
  ref?: Ref<HTMLInputElement>
}

export function Input({
  label,
  error,
  hint,
  prefix,
  suffix,
  fullWidth = false,
  id,
  className,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy =
    [ariaDescribedBy, hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className={cx(styles.field, fullWidth && styles.fullWidth, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={cx(styles.control, error && styles.invalid)}>
        {prefix ? <span className={styles.affix}>{prefix}</span> : null}
        <input
          {...rest}
          id={inputId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {suffix ? <span className={styles.affix}>{suffix}</span> : null}
      </div>
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
