import { describe, expect, it } from "vitest"

import {
  GATE_DURATION_MS,
  gateExpiryFrom,
  parseGateValue,
} from "./store"

const NOW = Date.parse("2026-10-25T10:00:00.000Z")

describe("gate storage value", () => {
  it("accepts a future expiry", () => {
    expect(
      parseGateValue(JSON.stringify({ unlockedUntil: NOW + 1_000 }), NOW)
    ).toEqual({ unlockedUntil: NOW + 1_000 })
  })

  it("rejects a missing or expired value", () => {
    expect(parseGateValue(null, NOW)).toBeNull()
    expect(
      parseGateValue(JSON.stringify({ unlockedUntil: NOW }), NOW)
    ).toBeNull()
    expect(
      parseGateValue(JSON.stringify({ unlockedUntil: NOW - 1 }), NOW)
    ).toBeNull()
  })

  it("rejects malformed values", () => {
    expect(parseGateValue("not-json", NOW)).toBeNull()
    expect(parseGateValue("null", NOW)).toBeNull()
    expect(parseGateValue("[]", NOW)).toBeNull()
    expect(
      parseGateValue(JSON.stringify({ unlockedUntil: "tomorrow" }), NOW)
    ).toBeNull()
    expect(
      parseGateValue(JSON.stringify({ unlockedUntil: Number.NaN }), NOW)
    ).toBeNull()
  })

  it("uses a 30-day window", () => {
    expect(GATE_DURATION_MS).toBe(30 * 24 * 60 * 60 * 1_000)
    expect(gateExpiryFrom(NOW)).toBe(NOW + GATE_DURATION_MS)
  })
})
