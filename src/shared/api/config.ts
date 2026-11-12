export type BugMode = 'off' | 'easy' | 'medium' | 'hard'

export const DEFAULT_API_BASE_URL = 'https://dummy-api-topaz.vercel.app'
export const CANDIDATE_STORAGE_KEY = 'cp.candidateId'
export const BUG_MODE_STORAGE_KEY = 'cp.bugMode'

export const BUG_MODES: readonly BugMode[] = ['off', 'easy', 'medium', 'hard']

export function normalizeBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim()
  return (trimmed || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
}

export function parseBugMode(value: string | undefined): BugMode {
  return BUG_MODES.find((mode) => mode === value) ?? 'off'
}

export const API_BASE_URL: string = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)

type CandidateStorage = Pick<Storage, 'getItem' | 'setItem'>

// Keeps the generated id stable for the session when storage is unavailable.
let memoryCandidateId: string | undefined

function defaultStorage(): CandidateStorage | undefined {
  try {
    return globalThis.localStorage ?? undefined
  } catch {
    return undefined
  }
}

/** Debug-panel override in storage → `VITE_API_BUG_MODE` → `off`. Read on every request. */
export function resolveBugMode(
  options: { envValue?: string; storage?: Pick<Storage, 'getItem'> } = {},
): BugMode {
  const storage = 'storage' in options ? options.storage : defaultStorage()
  let stored: string | null | undefined
  try {
    stored = storage?.getItem(BUG_MODE_STORAGE_KEY)
  } catch {
    stored = undefined
  }
  return (
    BUG_MODES.find((mode) => mode === stored) ??
    parseBugMode(options.envValue ?? import.meta.env.VITE_API_BUG_MODE)
  )
}

export function generateCandidateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `cp-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function resolveCandidateId(
  options: {
    envValue?: string
    storage?: CandidateStorage
  } = {},
): string {
  const envValue = (options.envValue ?? import.meta.env.VITE_CANDIDATE_ID)?.trim()
  if (envValue) return envValue

  const storage = 'storage' in options ? options.storage : defaultStorage()

  const stored = readStoredCandidate(storage)
  if (stored) return stored
  if (memoryCandidateId) return memoryCandidateId

  const generated = generateCandidateId()
  if (!persistCandidate(storage, generated)) memoryCandidateId = generated
  return generated
}

function readStoredCandidate(storage: CandidateStorage | undefined): string | undefined {
  try {
    return storage?.getItem(CANDIDATE_STORAGE_KEY)?.trim() || undefined
  } catch {
    return undefined
  }
}

function persistCandidate(storage: CandidateStorage | undefined, value: string): boolean {
  if (!storage) return false
  try {
    storage.setItem(CANDIDATE_STORAGE_KEY, value)
    return true
  } catch {
    return false
  }
}
