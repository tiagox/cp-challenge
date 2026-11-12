import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BUG_MODE_STORAGE_KEY,
  CANDIDATE_STORAGE_KEY,
  DEFAULT_API_BASE_URL,
  normalizeBaseUrl,
  parseBugMode,
  resolveBugMode,
  resolveCandidateId,
} from './config'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => void data.set(key, value)),
  }
}

describe('resolveCandidateId', () => {
  it('uses the env candidate over the stored one', () => {
    const storage = memoryStorage({ [CANDIDATE_STORAGE_KEY]: 'stored' })

    expect(resolveCandidateId({ envValue: 'from-env', storage })).toBe('from-env')
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('reuses the stored candidate', () => {
    const storage = memoryStorage({ [CANDIDATE_STORAGE_KEY]: 'stored' })

    expect(resolveCandidateId({ envValue: '', storage })).toBe('stored')
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('generates and persists a candidate when none exists', () => {
    const storage = memoryStorage()

    const id = resolveCandidateId({ envValue: '', storage })

    expect(id).toMatch(/^[0-9a-f-]{36}$/)
    expect(storage.setItem).toHaveBeenCalledWith(CANDIDATE_STORAGE_KEY, id)
    expect(resolveCandidateId({ envValue: '', storage })).toBe(id)
  })

  it('ignores a whitespace-only env value', () => {
    const storage = memoryStorage({ [CANDIDATE_STORAGE_KEY]: 'stored' })

    expect(resolveCandidateId({ envValue: '  ', storage })).toBe('stored')
  })

  it('falls back when crypto.randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {})
    const storage = memoryStorage()

    expect(resolveCandidateId({ envValue: '', storage })).toMatch(/^cp-\d+-[a-z0-9]+$/)
  })

  it('reads VITE_CANDIDATE_ID when no env value is injected', () => {
    vi.stubEnv('VITE_CANDIDATE_ID', 'vite-env')

    expect(resolveCandidateId({ storage: memoryStorage() })).toBe('vite-env')
  })
})

describe('parseBugMode', () => {
  it('accepts known modes', () => {
    expect(parseBugMode('off')).toBe('off')
    expect(parseBugMode('hard')).toBe('hard')
  })

  it('falls back to off for missing or invalid values', () => {
    expect(parseBugMode(undefined)).toBe('off')
    expect(parseBugMode('')).toBe('off')
    expect(parseBugMode('OFF')).toBe('off')
    expect(parseBugMode('chaos')).toBe('off')
  })
})

describe('normalizeBaseUrl', () => {
  it('strips trailing slashes', () => {
    expect(normalizeBaseUrl('https://api.example.com/')).toBe('https://api.example.com')
    expect(normalizeBaseUrl('https://api.example.com///')).toBe('https://api.example.com')
  })

  it('defaults to the challenge API', () => {
    expect(normalizeBaseUrl(undefined)).toBe(DEFAULT_API_BASE_URL)
    expect(normalizeBaseUrl('')).toBe(DEFAULT_API_BASE_URL)
  })
})

describe('module constants', () => {
  afterEach(() => {
    vi.resetModules()
  })

  it('reads the base URL from env', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/')
    vi.resetModules()

    const config = await import('./config')

    expect(config.API_BASE_URL).toBe('https://api.example.com')
  })
})

describe('resolveBugMode', () => {
  it('uses a valid stored mode over env', () => {
    const storage = memoryStorage({ [BUG_MODE_STORAGE_KEY]: 'hard' })

    expect(resolveBugMode({ envValue: 'easy', storage })).toBe('hard')
  })

  it('falls back to env when the stored mode is missing or invalid', () => {
    expect(resolveBugMode({ envValue: 'medium', storage: memoryStorage() })).toBe('medium')
    expect(
      resolveBugMode({
        envValue: 'medium',
        storage: memoryStorage({ [BUG_MODE_STORAGE_KEY]: 'nope' }),
      }),
    ).toBe('medium')
  })

  it('defaults to off', () => {
    expect(resolveBugMode({ envValue: 'nope', storage: undefined })).toBe('off')
  })
})
