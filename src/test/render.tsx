import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { i18n } from '@/shared/i18n'
import type { AppLocale } from '@/shared/i18n/types'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
}

/** Renders in `en` by default; pass `{ lang: 'es' }` for Spanish coverage. */
export function renderWithProviders(
  ui: ReactNode,
  options: { route?: string; lang?: AppLocale } = {},
): RenderResult {
  void i18n.changeLanguage(options.lang ?? 'en')
  const queryClient = createTestQueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[options.route ?? '/']}>
        <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
