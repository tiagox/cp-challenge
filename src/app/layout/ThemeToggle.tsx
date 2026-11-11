import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/shared/ui/IconButton'
import { useTheme } from '../theme/ThemeProvider'

/** Shows the theme it switches to: moon in light mode, sun in dark mode. */
export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <IconButton
      label={isDark ? t('nav.switchToLight') : t('nav.switchToDark')}
      icon={isDark ? <Sun /> : <Moon />}
      onClick={toggleTheme}
    />
  )
}
