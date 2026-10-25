import { describe, expect, it } from "vitest"

import { buildDemoDashboard } from "./dashboard"

describe("demo dashboard", () => {
  const dashboard = buildDemoDashboard()

  it("is deterministic", () => {
    expect(buildDemoDashboard()).toEqual(dashboard)
  })

  it("produces a projectable score inside the 0-400 scale", () => {
    expect(dashboard.projected.projectable).toBe(true)
    expect(dashboard.projected.score).toBeGreaterThanOrEqual(0)
    expect(dashboard.projected.score).toBeLessThanOrEqual(400)
    expect(dashboard.projected.low).toBeLessThanOrEqual(
      dashboard.projected.score
    )
    expect(dashboard.projected.high).toBeGreaterThanOrEqual(
      dashboard.projected.score
    )
  })

  it("shows four subjects and three weak topics", () => {
    expect(dashboard.subjects).toHaveLength(4)
    expect(dashboard.weakTopics).toHaveLength(3)
  })

  it("improves on the projection from 30 days ago", () => {
    expect(dashboard.projected.sinceLastMonth).toBeGreaterThan(0)
  })

  it("has enough breadth for a high-confidence range", () => {
    expect(dashboard.projected.coverage).toBeGreaterThanOrEqual(60)
    expect(dashboard.projected.confidence).toBe("high")
  })

  it("does not flag timing risk at the demo pace", () => {
    expect(dashboard.projected.timingRisk).toBe(false)
  })

  it("puts organic chemistry at the top of the weak list", () => {
    expect(dashboard.weakTopics[0]?.id).toBe("chem-organic")
  })
})
