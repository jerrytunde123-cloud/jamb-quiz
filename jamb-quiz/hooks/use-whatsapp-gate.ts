"use client"

import { useSyncExternalStore } from "react"

import {
  getGateServerSnapshot,
  getGateSnapshot,
  lockGate,
  subscribeToGate,
  unlockGate,
} from "@/lib/gate/store"

/**
 * The gate is an external store, not React state duplicated in a provider.
 * This keeps localStorage, the server render, and every consumer in sync.
 */
export function useWhatsAppGate() {
  const snapshot = useSyncExternalStore(
    subscribeToGate,
    getGateSnapshot,
    getGateServerSnapshot
  )

  return {
    isUnlocked: snapshot !== null,
    unlockedUntil: snapshot?.unlockedUntil ?? null,
    unlock: unlockGate,
    lock: lockGate,
  }
}
