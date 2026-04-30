'use client'
import { useCallback, useSyncExternalStore } from 'react'

const LOCAL_STORAGE_EVENT = 'dona-flora:local-storage-change'

/**
 * Hydration-safe localStorage hook for a single string value from a known allowlist.
 *
 * On first render (SSR + initial client render) returns `fallback` so React's
 * hydration matches. Then, in an effect, reads from localStorage and (only if
 * the stored value is within `allowed`) updates state. Writes are persisted on
 * every setter call, swallowing errors from private-mode / storage-disabled
 * browsers so the UI never crashes.
 */
export function useLocalStorage<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (v: T) => void] {
  const getSnapshot = useCallback((): T => {
    if (typeof window === 'undefined') {
      return fallback
    }

    try {
      const raw = window.localStorage.getItem(key)
      if (raw && (allowed as readonly string[]).includes(raw)) {
        return raw as T
      }
    } catch {
      /* private-mode or storage disabled */
    }

    return fallback
  }, [allowed, fallback, key])

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined') {
        return () => undefined
      }

      const handleStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === key) {
          onStoreChange()
        }
      }

      const handleCustomStorage = (event: Event) => {
        const detail = (event as CustomEvent<{ key?: string }>).detail
        if (!detail?.key || detail.key === key) {
          onStoreChange()
        }
      }

      window.addEventListener('storage', handleStorage)
      window.addEventListener(LOCAL_STORAGE_EVENT, handleCustomStorage as EventListener)

      return () => {
        window.removeEventListener('storage', handleStorage)
        window.removeEventListener(LOCAL_STORAGE_EVENT, handleCustomStorage as EventListener)
      }
    },
    [key],
  )

  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback)

  const set = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, next)
      } catch {
        /* private-mode or storage disabled */
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(LOCAL_STORAGE_EVENT, {
            detail: { key },
          }),
        )
      }
    },
    [key],
  )

  return [value, set]
}
