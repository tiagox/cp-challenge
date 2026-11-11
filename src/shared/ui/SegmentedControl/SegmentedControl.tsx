import { useId } from 'react'
import { cx } from '@/shared/lib/cx'
import { VisuallyHidden } from '../VisuallyHidden'
import styles from './SegmentedControl.module.scss'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

export interface SegmentedControlProps<T extends string> {
  /** Accessible group name, rendered as a visually hidden legend. */
  label: string
  value: T
  options: ReadonlyArray<SegmentedOption<T>>
  onChange: (value: T) => void
  name?: string
  disabled?: boolean
  className?: string
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  name,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const generatedName = useId()
  const groupName = name ?? generatedName

  return (
    <fieldset className={cx(styles.group, className)} disabled={disabled}>
      <legend>
        <VisuallyHidden>{label}</VisuallyHidden>
      </legend>
      {options.map((option) => (
        <label
          key={option.value}
          className={cx(styles.option, option.disabled && styles.optionDisabled)}
        >
          <input
            type="radio"
            className={styles.input}
            name={groupName}
            value={option.value}
            checked={option.value === value}
            disabled={option.disabled}
            onChange={() => onChange(option.value)}
          />
          <span className={styles.text}>{option.label}</span>
        </label>
      ))}
    </fieldset>
  )
}
