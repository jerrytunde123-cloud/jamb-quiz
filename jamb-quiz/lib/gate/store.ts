export const GATE_STORAGE_KEY = "jamb-quiz:whatsapp-gate:v1"

/** The gate is a nudge, not a login. Remember the tap for a month. */
export const GATE_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export type GateSnapshot = {
  unlockedUntil: number
} | null

/**
 * Parses the persisted gate value without touching the browser.
 * Kept pure so the expiry rules can be tested in Node.
 */
export function parseGateValue(raw: string | null, now: number): GateSnapshot {
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== "object" || parsed === null) return null

  const unlockedUntil = (parsed as { unlockedUntil?: unknown }).unlockedUntil
  if (
    typeof unlockedUntil !== "number" ||
    !Number.isFinite(unlockedUntil) ||
    unlockedUntil <= now
  ) {
    return null
  }

  return { unlockedUntil }
}

export function gateExpiryFrom(now: number): number {
  return now + GATE_DURATION_MS
}

let cachedRaw: string | null | undefined
let cachedSnapshot: GateSnapshot = null
let memorySnapshot: GateSnapshot = null
let storageUnavailable = false

const listeners = new Set<() => void>()
let listeningForStorage = false

function notify() {
  for (const listener of listeners) listener()
}

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(GATE_STORAGE_KEY)
  } catch {
    storageUnavailable = true
    return null
  }
}

function readSnapshot(): GateSnapshot {
  if (typeof window === "undefined") return null

  if (storageUnavailable) {
    if (memorySnapshot && memorySnapshot.unlockedUntil <= Date.now()) {
      memorySnapshot = null
    }
    return memorySnapshot
  }

  const raw = readStorage()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedSnapshot = parseGateValue(raw, Date.now())
  }

  if (cachedSnapshot && cachedSnapshot.unlockedUntil <= Date.now()) {
    cachedSnapshot = null
  }

  return cachedSnapshot
}

function handleStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== GATE_STORAGE_KEY) return

  cachedRaw = undefined
  cachedSnapshot = null
  notify()
}

export function subscribeToGate(listener: () => void): () => void {
  listeners.add(listener)

  if (!listeningForStorage && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage)
    listeningForStorage = true
  }

  return () => {
    listeners.delete(listener)

    if (listeners.size === 0 && listeningForStorage) {
      window.removeEventListener("storage", handleStorage)
      listeningForStorage = false
    }
  }
}

/** The client snapshot. Safe to call from event handlers for a fresh check. */
export function getGateSnapshot(): GateSnapshot {
  return readSnapshot()
}

/** The server has no localStorage, so it must render the locked state. */
export function getGateServerSnapshot(): GateSnapshot {
  return null
}

export function isGateUnlocked(now = Date.now()): boolean {
  const snapshot = readSnapshot()
  return snapshot !== null && snapshot.unlockedUntil > now
}

/**
 * Persists the unlock. If storage is blocked (private mode, embedded webview),
 * keep it in memory for the current page so the flow still works.
 */
export function unlockGate(now = Date.now()): GateSnapshot {
  const next: GateSnapshot = { unlockedUntil: gateExpiryFrom(now) }
  memorySnapshot = next
  storageUnavailable = false

  try {
    const raw = JSON.stringify(next)
    window.localStorage.setItem(GATE_STORAGE_KEY, raw)
    cachedRaw = raw
    cachedSnapshot = next
  } catch {
    storageUnavailable = true
    cachedRaw = undefined
    cachedSnapshot = null
  }

  notify()
  return next
}

/** Re-locks this device. Useful when switching WhatsApp accounts. */
export function lockGate(): void {
  memorySnapshot = null
  storageUnavailable = false
  cachedRaw = undefined
  cachedSnapshot = null

  try {
    window.localStorage.removeItem(GATE_STORAGE_KEY)
  } catch {
    storageUnavailable = true
  }

  notify()
}
