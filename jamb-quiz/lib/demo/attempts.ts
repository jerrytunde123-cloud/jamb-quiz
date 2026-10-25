import type { Answer } from "../readiness"

export const DEMO_NOW = Date.parse("2026-10-25T18:00:00.000Z")

const WINDOW_DAYS = 90
const MS_PER_DAY = 86_400_000

/**
 * Deterministic PRNG so the static page and the test suite see identical data.
 * This is demo data, not a security primitive.
 */
function hashString(value: string): number {
  let hash = 2_166_136_261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

/**
 * Illustrative practice history. Each topic improves slightly over the window,
 * so a projection computed 30 days ago is genuinely lower than today's.
 */
const PLAN: Record<string, { attempts: number; accuracy: number }> = {
  "eng-comprehension": { attempts: 120, accuracy: 0.82 },
  "eng-lexis": { attempts: 100, accuracy: 0.78 },
  "eng-oral": { attempts: 80, accuracy: 0.7 },
  "eng-grammar": { attempts: 100, accuracy: 0.8 },
  "math-number": { attempts: 55, accuracy: 0.7 },
  "math-algebra": { attempts: 80, accuracy: 0.68 },
  "math-geometry": { attempts: 70, accuracy: 0.62 },
  "math-calculus": { attempts: 55, accuracy: 0.58 },
  "math-statistics": { attempts: 50, accuracy: 0.66 },
  "phy-mechanics": { attempts: 70, accuracy: 0.74 },
  "phy-waves": { attempts: 55, accuracy: 0.7 },
  "phy-electricity": { attempts: 70, accuracy: 0.72 },
  "phy-optics": { attempts: 40, accuracy: 0.64 },
  "phy-modern": { attempts: 30, accuracy: 0.6 },
  "chem-organic": { attempts: 60, accuracy: 0.42 },
  "chem-inorganic": { attempts: 50, accuracy: 0.68 },
  "chem-physical": { attempts: 50, accuracy: 0.62 },
  "chem-analytical": { attempts: 30, accuracy: 0.66 },
}

function buildTopicAnswers(topicId: string): Answer[] {
  const plan = PLAN[topicId]
  if (!plan) return []

  const random = mulberry32(hashString(topicId))
  const windowStart = DEMO_NOW - WINDOW_DAYS * MS_PER_DAY

  return Array.from({ length: plan.attempts }, (_, index) => {
    const progress =
      plan.attempts === 1 ? 1 : index / (plan.attempts - 1)
    const probability = Math.min(
      0.95,
      Math.max(0.05, plan.accuracy - 0.07 + 0.14 * progress)
    )

    const answeredAt = Math.round(
      windowStart +
        ((index + 1) / plan.attempts) * (WINDOW_DAYS - 1) * MS_PER_DAY
    )

    return {
      topicId,
      correct: random() < probability,
      difficulty: random() * 3 - 1.5,
      seconds: 18 + random() * 65,
      changedCount: Math.floor(random() * 3),
      answeredAt,
    }
  })
}

export const DEMO_ATTEMPTS: readonly Answer[] = Object.keys(PLAN).flatMap(
  (topicId) => buildTopicAnswers(topicId)
)
