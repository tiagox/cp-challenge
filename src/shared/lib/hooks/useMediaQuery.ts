import { useCallback, useSyncExternalStore } from 'react'

function canMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

/** Subscribes to a media query. Returns `false` where `matchMedia` is unavailable. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!canMatchMedia()) return () => {}
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = () => (canMatchMedia() ? window.matchMedia(query).matches : false)

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
