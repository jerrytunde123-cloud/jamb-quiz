"use client"

import { useCallback, useSyncExternalStore } from "react"

/** Parent-app storage keys. Keep them so existing devices keep their history. */
export const RECENTS_KEY = "jamb_recent_subjects"
export const MAX_RECENTS = 4

const EVENT_NAME = "local-storage:recent_subjects"

/** Read the stored subject slugs, tolerating corrupt or missing storage. */
export function getRecentSlugs(): string[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(RECENTS_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (slug): slug is string => typeof slug === "string" && Boolean(slug)
    )
  } catch {
    return []
  }
}

/** Record a subject as recently practiced, moving it to the front. */
export function addRecentSubject(slug: string): void {
  if (typeof window === "undefined" || !slug) return

  try {
    const updated = [
      slug,
      ...getRecentSlugs().filter((entry) => entry !== slug),
    ].slice(0, MAX_RECENTS)

    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
    // Storage can be unavailable in private mode; recents are optional.
  }
}

/** Clear the recently practiced list. */
export function clearRecentSubjects(): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(RECENTS_KEY)
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
    // Ignore storage failures.
  }
}

/**
 * Subscribe to the recent list without copying it into React state.
 * The server snapshot is always empty, so hydration is stable.
 */
export function useRecentSlugs(): [
  string[],
  (slug: string) => void,
  () => void,
] {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("storage", onChange)
    window.addEventListener(EVENT_NAME, onChange)

    return () => {
      window.removeEventListener("storage", onChange)
      window.removeEventListener(EVENT_NAME, onChange)
    }
  }, [])

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(RECENTS_KEY) ?? "[]"
    } catch {
      return "[]"
    }
  }, [])

  const getServerSnapshot = useCallback(() => "[]", [])

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  let slugs: string[] = []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      slugs = parsed.filter(
        (slug): slug is string => typeof slug === "string" && Boolean(slug)
      )
    }
  } catch {
    slugs = []
  }

  return [slugs, addRecentSubject, clearRecentSubjects]
}
