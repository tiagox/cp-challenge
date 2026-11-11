/* eslint-disable react-refresh/only-export-components -- test helpers, never hot-reloaded */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '@/app/routes'
import { ThemeProvider } from '@/app/theme/ThemeProvider'
import { OrderTicketProvider } from '@/features/order'
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

interface RenderOptions {
  route?: string
  lang?: AppLocale
  queryClient?: QueryClient
}

function AppTestProviders({
  queryClient,
  children,
}: {
  queryClient: QueryClient
  children: ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <OrderTicketProvider>
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        </OrderTicketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

/** Renders in `en` by default; pass `{ lang: 'es' }` for Spanish coverage. */
export function renderWithProviders(ui: ReactNode, options: RenderOptions = {}): RenderResult {
  void i18n.changeLanguage(options.lang ?? 'en')
  const queryClient = options.queryClient ?? createTestQueryClient()

  return render(
    <AppTestProviders queryClient={queryClient}>
      <MemoryRouter initialEntries={[options.route ?? '/']}>{ui}</MemoryRouter>
    </AppTestProviders>,
  )
}

/** Renders the real route tree (layout, lazy pages, not-found) at `route`. */
export function renderApp(options: RenderOptions = {}): RenderResult {
  void i18n.changeLanguage(options.lang ?? 'en')
  const queryClient = options.queryClient ?? createTestQueryClient()
  const router = createMemoryRouter(routes, { initialEntries: [options.route ?? '/'] })

  return render(
    <AppTestProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppTestProviders>,
  )
}
