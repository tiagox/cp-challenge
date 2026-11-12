import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDateTime, formatPercent, formatQuantity } from './format'

/** Intl output uses non-breaking spaces; normalize them before asserting. */
const normalize = (value: string | null) => value?.replace(/[\u00a0\u202f]/g, ' ') ?? null

describe('formatCurrency', () => {
  it('formats EN as ARS with the code', () => {
    expect(normalize(formatCurrency(1234.56, 'en'))).toBe('ARS 1,234.56')
  })

  it('formats ES with the peso symbol', () => {
    expect(normalize(formatCurrency(1234.56, 'es'))).toBe('$ 1.234,56')
  })

  it('always shows two decimals', () => {
    expect(normalize(formatCurrency(5, 'en'))).toBe('ARS 5.00')
    expect(normalize(formatCurrency(5, 'es'))).toBe('$ 5,00')
  })

  it('shows the sign when signed', () => {
    expect(normalize(formatCurrency(12.5, 'en', { signed: true }))).toBe('+ARS 12.50')
    expect(normalize(formatCurrency(-12.5, 'es', { signed: true }))).toBe('-$ 12,50')
  })

  it.each([null, undefined, NaN, Infinity, -Infinity])('returns null for %s', (value) => {
    expect(formatCurrency(value, 'en')).toBeNull()
  })
})

describe('formatPercent', () => {
  it('formats a percentage value in EN and ES', () => {
    expect(normalize(formatPercent(12.34, 'en'))).toBe('12.34%')
    expect(normalize(formatPercent(12.34, 'es'))).toBe('12,34%')
  })

  it('shows the sign when signed', () => {
    expect(normalize(formatPercent(12.34, 'en', { signed: true }))).toBe('+12.34%')
    expect(normalize(formatPercent(12.34, 'es', { signed: true }))).toBe('+12,34%')
    expect(normalize(formatPercent(-8.69, 'es', { signed: true }))).toBe('-8,69%')
  })

  it.each([null, undefined, NaN, Infinity])('returns null for %s', (value) => {
    expect(formatPercent(value, 'es')).toBeNull()
  })
})

describe('formatQuantity', () => {
  it('formats integers with locale grouping', () => {
    expect(formatQuantity(1234, 'en')).toBe('1,234')
    expect(formatQuantity(1234, 'es')).toBe('1.234')
  })

  it('returns null for invalid input', () => {
    expect(formatQuantity(null, 'en')).toBeNull()
    expect(formatQuantity(NaN, 'es')).toBeNull()
  })
})

describe('formatDateTime', () => {
  // vitest.config.ts runs tests in UTC.
  const iso = '2026-11-12T01:53:34.884Z'

  it('formats EN date and time', () => {
    expect(formatDateTime(iso, 'en')).toBe('Nov 12, 2026, 1:53 AM')
  })

  it('formats ES date and time', () => {
    expect(formatDateTime(iso, 'es')).toBe('12 nov 2026, 1:53 a. m.')
  })

  it.each(['not a date', '', null, undefined])('returns null for %s', (value) => {
    expect(formatDateTime(value, 'en')).toBeNull()
  })
})
