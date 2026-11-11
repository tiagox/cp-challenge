import { Search, X } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/shared/ui/IconButton'
import { Input } from '@/shared/ui/Input'
import styles from './SearchInput.module.scss'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onChange('')
    // The clear button unmounts, so keep focus in the search box.
    inputRef.current?.focus()
  }

  return (
    <div role="search" className={styles.root}>
      <Input
        ref={inputRef}
        type="search"
        inputMode="search"
        autoComplete="off"
        spellCheck={false}
        label={t('search.input.label')}
        placeholder={t('search.input.placeholder')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        prefix={<Search aria-hidden="true" />}
        suffix={
          value ? (
            <IconButton
              label={t('search.input.clear')}
              icon={<X aria-hidden="true" />}
              variant="ghost"
              onClick={handleClear}
            />
          ) : null
        }
        fullWidth
      />
    </div>
  )
}
