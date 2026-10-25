"use client"

import { useSyncExternalStore } from "react"

/**
 * Phones and tablets report a coarse primary pointer. Desktop Safari/Chrome
 * report a fine pointer. We use this to choose the WhatsApp app scheme on the
 * device where the app actually exists.
 *
 * The server snapshot is `false`, so the first HTML always contains the safe
 * https channel link. The href upgrades after hydration rather than during
 * render, which is what caused the legacy gate's hydration mismatch.
 */
const COARSE_POINTER_QUERY = "(pointer: coarse)"

function subscribeToPointerChange(onChange: () => void): () => void {
  const media = window.matchMedia(COARSE_POINTER_QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

function getPointerSnapshot(): boolean {
  return window.matchMedia(COARSE_POINTER_QUERY).matches
}

function getPointerServerSnapshot(): boolean {
  return false
}

export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    subscribeToPointerChange,
    getPointerSnapshot,
    getPointerServerSnapshot
  )
}
