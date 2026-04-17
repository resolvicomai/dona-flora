'use client'
import { useEffect, useState } from 'react'

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
  const [value, setValue] = useState<T>(fallback) // SSR-safe default

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw && (allowed as readonly string[]).includes(raw)) {
        setValue(raw as T)
      }
    } catch {
      /* private-mode or storage disabled */
    }
  }, [key, allowed])

  function set(next: T) {
    setValue(next)
    try {
      window.localStorage.setItem(key, next)
    } catch {
      /* private-mode or storage disabled */
    }
  }

  return [value, set]
}
