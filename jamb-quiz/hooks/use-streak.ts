"use client"

import { useCallback, useSyncExternalStore } from "react"

import { getStreakInfo, STREAK_EVENT } from "@/lib/streak"

/** The current streak, hydrated safely from localStorage. */
export function useStreak(): number {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("storage", onChange)
    window.addEventListener(STREAK_EVENT, onChange)

    return () => {
      window.removeEventListener("storage", onChange)
      window.removeEventListener(STREAK_EVENT, onChange)
    }
  }, [])

  const getSnapshot = useCallback(() => getStreakInfo().streak, [])
  const getServerSnapshot = useCallback(() => 0, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
