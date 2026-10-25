"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * Read and write a localStorage value with a stable server snapshot.
 *
 * `useSyncExternalStore` keeps the value outside React state, so a storage
 * read never causes a cascading render or a hydration mismatch.
 */
export function useLocalStorage(
  key: string,
  fallback = ""
): [string, (value: string) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      window.addEventListener("storage", onChange)
      window.addEventListener(`local-storage:${key}`, onChange)

      return () => {
        window.removeEventListener("storage", onChange)
        window.removeEventListener(`local-storage:${key}`, onChange)
      }
    },
    [key]
  )

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key) ?? fallback
    } catch {
      return fallback
    }
  }, [key, fallback])

  const getServerSnapshot = useCallback(() => fallback, [fallback])

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setValue = useCallback(
    (next: string) => {
      try {
        window.localStorage.setItem(key, next)
      } catch {
        // Storage is optional; private mode and quota failures are ignored.
      }
      window.dispatchEvent(new Event(`local-storage:${key}`))
    },
    [key]
  )

  return [value, setValue]
}
