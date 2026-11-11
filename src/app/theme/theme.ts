export type Theme = 'dark' | 'light'
export const THEME_STORAGE_KEY = 'cp.theme'
export const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)'

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light'
}

export function readStoredTheme(): string | null {
  try {
    return globalThis.localStorage?.getItem(THEME_STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(PREFERS_DARK_QUERY).matches
}

/**
 * Stored choice → `prefers-color-scheme: dark` → `light`.
 * Keep in sync with the boot script in `index.html`.
 */
export function resolveInitialTheme(
  options: { stored?: string | null; prefersDark?: boolean } = {},
): Theme {
  const stored = 'stored' in options ? options.stored : readStoredTheme()
  if (isTheme(stored)) return stored

  const prefersDark = options.prefersDark ?? systemPrefersDark()
  return prefersDark ? 'dark' : 'light'
}

export function persistTheme(theme: Theme): void {
  try {
    globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage can be unavailable (private mode, quota); the choice lasts for this session.
  }
}
