import { useQueryClient } from '@tanstack/react-query'
import { Bug } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  BUG_MODE_STORAGE_KEY,
  BUG_MODES,
  CANDIDATE_STORAGE_KEY,
  generateCandidateId,
  resolveBugMode,
  resolveCandidateId,
  type BugMode,
} from '@/shared/api/config'
import { Button } from '@/shared/ui/Button'
import { IconButton } from '@/shared/ui/IconButton'
import styles from './DebugPanel.module.scss'

export const DEBUG_STORAGE_KEY = 'cp.debug'

function store(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage blocked: the panel still works for this page load.
  }
}

function isStored(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}

/** `?debug` turns debug mode on, `?debug=off` turns it off; the flag persists in storage. */
function syncDebugFlag(param: string | null): boolean {
  if (param === 'off') store(DEBUG_STORAGE_KEY, null)
  else if (param !== null) store(DEBUG_STORAGE_KEY, '1')
  return isStored(DEBUG_STORAGE_KEY)
}

export function DebugPanel() {
  const [params] = useSearchParams()
  const [enabled, setEnabled] = useState(() => syncDebugFlag(params.get('debug')))

  if (!enabled) return null
  return <DebugPanelContent onTurnOff={() => setEnabled(false)} />
}

function DebugPanelContent({ onTurnOff }: { onTurnOff: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const id = useId()
  const popoverId = `${id}-panel`
  const [bugMode, setBugMode] = useState<BugMode>(() => resolveBugMode())
  const [candidate, setCandidate] = useState(() => resolveCandidateId())
  const candidateFromEnv = Boolean(import.meta.env.VITE_CANDIDATE_ID?.trim())

  // New headers apply to the next request; reset so every screen refetches with them.
  const refetchAll = () => void queryClient.resetQueries()

  const changeBugMode = (mode: BugMode) => {
    setBugMode(mode)
    // Store `off` too, so it overrides a non-off VITE_API_BUG_MODE.
    store(BUG_MODE_STORAGE_KEY, mode)
    refetchAll()
  }

  const applyCandidate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = candidate.trim()
    if (!value) return
    store(CANDIDATE_STORAGE_KEY, value)
    refetchAll()
  }

  const turnOff = () => {
    store(DEBUG_STORAGE_KEY, null)
    store(BUG_MODE_STORAGE_KEY, null)
    refetchAll()
    onTurnOff()
  }

  return (
    <>
      <IconButton
        label={t('common.debug.open')}
        icon={<Bug />}
        variant="ghost"
        size="sm"
        className={styles.trigger}
        popoverTarget={popoverId}
      />
      <div id={popoverId} popover="auto" className={styles.panel}>
        <p className={styles.title}>{t('common.debug.title')}</p>

        <label className={styles.field}>
          <span className={styles.label}>X-Enable-Bugs</span>
          <select
            className={styles.control}
            value={bugMode}
            onChange={(event) => changeBugMode(event.target.value as BugMode)}
          >
            {BUG_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>

        <form className={styles.field} onSubmit={applyCandidate}>
          <label className={styles.field}>
            <span className={styles.label}>X-Candidate-Id</span>
            <input
              className={styles.control}
              value={candidate}
              onChange={(event) => setCandidate(event.target.value)}
              disabled={candidateFromEnv}
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          {candidateFromEnv ? (
            <p className={styles.hint}>{t('common.debug.candidateFromEnv')}</p>
          ) : (
            <div className={styles.actions}>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCandidate(generateCandidateId())}
              >
                {t('common.debug.newCandidate')}
              </Button>
              <Button size="sm" type="submit">
                {t('common.debug.apply')}
              </Button>
            </div>
          )}
        </form>

        <button type="button" className={styles.turnOff} onClick={turnOff}>
          {t('common.debug.turnOff')}
        </button>
      </div>
    </>
  )
}
