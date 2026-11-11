import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMediaQuery } from '@/shared/lib/hooks/useMediaQuery'
import {
  isTheme,
  persistTheme,
  PREFERS_DARK_QUERY,
  readStoredTheme,
  resolveInitialTheme,
  type Theme,
} from './theme'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // `null` until the user makes an explicit choice; until then the theme follows the system.
  const [explicitTheme, setExplicitTheme] = useState<Theme | null>(() => {
    const stored = readStoredTheme()
    return isTheme(stored) ? stored : null
  })
  const prefersDark = useMediaQuery(PREFERS_DARK_QUERY)
  // Same rule as the boot script, so the first render matches the `data-theme` it already set.
  const theme = resolveInitialTheme({ stored: explicitTheme, prefersDark })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const value = useMemo<ThemeContextValue>(() => {
    const setTheme = (next: Theme) => {
      setExplicitTheme(next)
      persistTheme(next)
    }
    return {
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }
  }, [theme])

  return <ThemeContext value={value}>{children}</ThemeContext>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its provider
export function useTheme(): ThemeContextValue {
  const context = use(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
