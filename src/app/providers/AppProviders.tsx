import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { OrderTicketProvider } from '@/features/order'
import { queryClient } from '@/shared/api/queryClient'
import { router } from '../router'
import { ThemeProvider } from '../theme/ThemeProvider'
import { ErrorBoundary } from './ErrorBoundary'

export function AppProviders() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <OrderTicketProvider>
            <RouterProvider router={router} />
          </OrderTicketProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
