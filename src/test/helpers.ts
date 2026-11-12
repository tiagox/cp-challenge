import { within } from '@testing-library/react'
import { http } from 'msw'
import { vi } from 'vitest'
import { API_BASE_URL } from '@/shared/api/config'
import type { CreateOrderRequest } from '@/shared/api/types'
import indexHtml from '../../index.html?raw'
import { server } from './server'

/** The `<tr>` whose row header starts with `ticker`. */
export function rowFor(table: HTMLElement, ticker: string): HTMLTableRowElement {
  const row = within(table)
    .getByRole('rowheader', { name: new RegExp(`^${ticker}`) })
    .closest('tr')
  if (!row) throw new Error(`No row for ${ticker}`)
  return row
}

/** Records every POST /orders body, then falls through to the handlers registered before it. */
export function captureOrders(): CreateOrderRequest[] {
  const bodies: CreateOrderRequest[] = []
  server.use(
    http.post(`${API_BASE_URL}/orders`, async ({ request }) => {
      bodies.push((await request.clone().json()) as CreateOrderRequest)
    }),
  )
  return bodies
}

type ChangeListener = (event: MediaQueryListEvent) => void

/** jsdom has no `matchMedia`; this stub lets tests flip `prefers-color-scheme`. */
export function stubPrefersDark(initial: boolean) {
  let matches = initial
  const listeners = new Set<ChangeListener>()
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return query === '(prefers-color-scheme: dark)' && matches
      },
      media: query,
      addEventListener: (_type: string, listener: ChangeListener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: ChangeListener) => listeners.delete(listener),
    })),
  )
  return {
    set(value: boolean) {
      matches = value
      for (const listener of listeners) listener({ matches } as MediaQueryListEvent)
    },
  }
}

/** Runs the inline theme/language boot script from `index.html`. */
export function runBootScript(): void {
  const script = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)?.[1]
  if (!script) throw new Error('Boot script not found in index.html')
  new Function(script)()
}
