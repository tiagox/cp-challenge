import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { i18n } from '@/shared/i18n'
import { server } from './server'

beforeAll(() => {
  // MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame`.
  server.listen({ onUnhandledFrame: 'error' })
})

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
})

afterAll(() => {
  server.close()
})
