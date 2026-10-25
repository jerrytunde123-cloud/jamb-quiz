import { describe, expect, it } from "vitest"

import {
  aggregateProjection,
  computeTopicMastery,
  confidenceLevel,
  coverageFor,
  decayTheta,
  expectedCorrect,
  isGuess,
  kFactor,
  marginFor,
  median,
  pickBestThree,
  project,
  scaleAbility,
  scoreSubject,
  SCORING_MODEL_VERSION,
  updateTheta,
} from "./index"
import type {
  Answer,
  Subject,
  SubjectProjection,
  Topic,
} from "./types"

const T0 = Date.parse("2026-09-01T09:00:00.000Z")
const MINUTE = 60_000
const DAY = 86_400_000

function makeSubject(
  id: string,
  topics: ReadonlyArray<{ id: string; weight: number }>,
  blueprintQuestions = 40
): Subject {
  return {
    id,
    name: id,
    blueprintQuestions,
    topics: topics.map<Topic>((topic) => ({
      id: topic.id,
      subjectId: id,
      name: topic.id,
      blueprintWeight: topic.weight,
    })),
  }
}

function answersFor(
  topicId: string,
  count: number,
  accuracy: number,
  startAt = T0,
  difficulty = 0
): Answer[] {
  return Array.from({ length: count }, (_, index) => ({
    topicId,
    correct: ((index * 13) % 100) < accuracy * 100,
    difficulty,
    seconds: 30,
    changedCount: 0,
    answeredAt: startAt + index * MINUTE,
  }))
}

function nowAfter(answers: readonly Answer[], extraDays = 0): number {
  const last = Math.max(...answers.map((answer) => answer.answeredAt), T0)
  return last + extraDays * DAY
}

function makeProjection(
  overrides: Partial<SubjectProjection> = {}
): SubjectProjection {
  return {
    subjectId: "s",
    name: "s",
    blueprintQuestions: 40,
    readiness: 50,
    rawReadiness: 50,
    coverage: 1,
    theta: 0,
    attempts: 100,
    correct: 50,
    accuracy: 0.5,
    medianSeconds: 30,
    timingRisk: false,
    margin: 10,
    confidence: "high",
    projectable: true,
    topics: [],
    ...overrides,
  }
}

describe("ability", () => {
  it("gives a coin flip at equal ability and difficulty", () => {
    expect(expectedCorrect(0, 0)).toBeCloseTo(0.5, 6)
    expect(expectedCorrect(2, 2)).toBeCloseTo(0.5, 6)
  })

  it("is monotonically increasing in ability", () => {
    expect(expectedCorrect(1, 0)).toBeGreaterThan(expectedCorrect(0, 0))
    expect(expectedCorrect(0, 0)).toBeGreaterThan(expectedCorrect(-1, 0))
  })

  it("calibrates the 0-100 scale", () => {
    expect(scaleAbility(0)).toBeCloseTo(25, 5)
    expect(scaleAbility(1)).toBeCloseTo(75, 5)
    expect(scaleAbility(2.5)).toBeGreaterThan(95)
    expect(scaleAbility(-2.5)).toBeLessThan(5)
  })

  it("starts K high and decays toward stability", () => {
    expect(kFactor(0)).toBe(0.4)
    expect(kFactor(19)).toBe(0.4)
    expect(kFactor(20)).toBe(0.4)
    expect(kFactor(60)).toBeLessThan(0.2)
    expect(kFactor(60)).toBeGreaterThan(0.15)
    expect(kFactor(10_000)).toBeCloseTo(0.15, 3)
  })

  it("detects fast, heavily-edited correct answers as guesses", () => {
    expect(isGuess(4.9, 2)).toBe(true)
    expect(isGuess(4.9, 1)).toBe(false)
    expect(isGuess(5, 3)).toBe(false)
    expect(isGuess(1, 2)).toBe(true)
  })

  it("moves theta by the expected Elo step", () => {
    const correct = updateTheta({
      theta: 0,
      attempts: 0,
      correct: true,
      difficulty: 0,
      seconds: 30,
    })
    expect(correct.theta).toBeCloseTo(0.2, 6)

    const wrong = updateTheta({
      theta: 0,
      attempts: 0,
      correct: false,
      difficulty: 0,
      seconds: 30,
    })
    expect(wrong.theta).toBeCloseTo(-0.2, 6)
  })

  it("discounts guessed-correct answers", () => {
    const clean = updateTheta({
      theta: 0,
      attempts: 0,
      correct: true,
      difficulty: 0,
      seconds: 30,
      changedCount: 0,
    })
    const guessed = updateTheta({
      theta: 0,
      attempts: 0,
      correct: true,
      difficulty: 0,
      seconds: 2,
      changedCount: 4,
    })

    expect(guessed.guess).toBe(true)
    expect(guessed.theta).toBeLessThan(clean.theta)
    expect(guessed.theta).toBeCloseTo(0, 6)
  })

  it("decays to 1/e after one 21-day time constant", () => {
    expect(decayTheta(2, T0, T0 + 21 * DAY)).toBeCloseTo(2 / Math.E, 6)
    expect(decayTheta(2, T0, T0 + 42 * DAY)).toBeCloseTo(
      2 / Math.E ** 2,
      6
    )
  })

  it("never decays backwards in time", () => {
    expect(decayTheta(2, T0, T0 - 10 * DAY)).toBeCloseTo(2, 6)
  })
})

describe("topic mastery replay", () => {
  it("replays answers chronologically regardless of input order", () => {
    const answers = answersFor("t1", 10, 0.7)
    const shuffled = [...answers].reverse()

    const ordered = computeTopicMastery("t1", answers, nowAfter(answers))
    const unordered = computeTopicMastery(
      "t1",
      shuffled,
      nowAfter(answers)
    )

    expect(unordered.theta).toBeCloseTo(ordered.theta, 10)
    expect(unordered.attempts).toBe(10)
  })

  it("does not mutate the input array", () => {
    const answers = answersFor("t1", 5, 0.6)
    const before = answers.map((answer) => answer.answeredAt)

    computeTopicMastery("t1", answers, nowAfter(answers))

    expect(answers.map((answer) => answer.answeredAt)).toEqual(before)
  })

  it("applies recency decay on read", () => {
    const answers = answersFor("t1", 1, 1)
    const immediate = computeTopicMastery(
      "t1",
      answers,
      nowAfter(answers)
    )
    const stale = computeTopicMastery(
      "t1",
      answers,
      nowAfter(answers, 21)
    )

    expect(immediate.rawTheta).toBeCloseTo(0.2, 6)
    expect(stale.theta).toBeCloseTo(immediate.rawTheta / Math.E, 6)
    expect(stale.theta).toBeLessThan(immediate.theta)
  })

  it("ignores answers from other topics", () => {
    const answers = [
      ...answersFor("t1", 3, 1),
      ...answersFor("t2", 9, 0),
    ]
    const mastery = computeTopicMastery("t1", answers, nowAfter(answers))

    expect(mastery.attempts).toBe(3)
    expect(mastery.correct).toBe(3)
  })
})

describe("coverage", () => {
  const subject = makeSubject("s", [
    { id: "a", weight: 0.5 },
    { id: "b", weight: 0.5 },
  ])

  it("is zero with no attempts", () => {
    expect(coverageFor(subject, new Map())).toBe(0)
  })

  it("weights partial topic coverage by blueprint weight", () => {
    const masteries = new Map([
      [
        "a",
        {
          topicId: "a",
          theta: 0,
          rawTheta: 0,
          attempts: 5,
          correct: 3,
          accuracy: 0.6,
          lastAttemptAt: T0,
        },
      ],
      [
        "b",
        {
          topicId: "b",
          theta: 0,
          rawTheta: 0,
          attempts: 10,
          correct: 6,
          accuracy: 0.6,
          lastAttemptAt: T0,
        },
      ],
    ])

    expect(coverageFor(subject, masteries)).toBeCloseTo(0.75, 6)
  })

  it("normalises blueprint weights that do not sum to one", () => {
    const weird = makeSubject("s", [
      { id: "a", weight: 1 },
      { id: "b", weight: 1 },
    ])
    const masteries = new Map([
      [
        "a",
        {
          topicId: "a",
          theta: 0,
          rawTheta: 0,
          attempts: 10,
          correct: 5,
          accuracy: 0.5,
          lastAttemptAt: T0,
        },
      ],
      [
        "b",
        {
          topicId: "b",
          theta: 0,
          rawTheta: 0,
          attempts: 10,
          correct: 5,
          accuracy: 0.5,
          lastAttemptAt: T0,
        },
      ],
    ])

    expect(coverageFor(weird, masteries)).toBe(1)
  })
})

describe("subject scoring", () => {
  const subject = makeSubject("s", [
    { id: "a", weight: 0.5 },
    { id: "b", weight: 0.5 },
  ])

  it("scores strong, broad evidence highly", () => {
    const answers = [
      ...answersFor("a", 15, 1),
      ...answersFor("b", 15, 1),
    ]
    const projection = scoreSubject(subject, answers, nowAfter(answers))

    expect(projection.coverage).toBe(1)
    expect(projection.readiness).toBeGreaterThan(80)
    expect(projection.readiness).toBeLessThanOrEqual(100)
    expect(projection.confidence).toBe("medium")
  })

  it("keeps coin-flip performance near the guessing baseline", () => {
    const answers = [
      ...answersFor("a", 30, 0.5),
      ...answersFor("b", 30, 0.5),
    ]
    const projection = scoreSubject(subject, answers, nowAfter(answers))

    expect(projection.coverage).toBe(1)
    expect(projection.readiness).toBeGreaterThan(15)
    expect(projection.readiness).toBeLessThan(40)
  })

  it("caps readiness when breadth is low", () => {
    // One topic, half-covered, with fast ability growth on hard questions.
    const narrow = makeSubject("narrow", [{ id: "a", weight: 1 }])
    const answers = answersFor("a", 5, 1, T0, 3)
    const projection = scoreSubject(narrow, answers, nowAfter(answers))

    expect(projection.coverage).toBeCloseTo(0.5, 6)
    expect(projection.rawReadiness).toBeGreaterThan(75)
    expect(projection.readiness).toBeCloseTo(75, 6)
    expect(projection.readiness).toBeLessThan(projection.rawReadiness)
  })

  it("does not project a subject with too few attempts", () => {
    const answers = answersFor("a", 4, 1)
    const projection = scoreSubject(subject, answers, nowAfter(answers))

    expect(projection.attempts).toBe(4)
    expect(projection.projectable).toBe(false)
    expect(projection.confidence).toBe("low")
  })

  it("ignores answers after the projection time", () => {
    const answers = answersFor("a", 20, 1)
    const cutoff = answers[9].answeredAt
    const projection = scoreSubject(subject, answers, cutoff)

    expect(projection.attempts).toBe(10)
    expect(projection.correct).toBe(10)
  })
})

describe("confidence", () => {
  it("follows the product thresholds", () => {
    expect(confidenceLevel(19, 1)).toBe("low")
    expect(confidenceLevel(20, 0.2)).toBe("medium")
    expect(confidenceLevel(60, 1)).toBe("medium")
    expect(confidenceLevel(61, 0.59)).toBe("medium")
    expect(confidenceLevel(61, 0.6)).toBe("high")
  })

  it("narrows as evidence and coverage grow", () => {
    const few = marginFor(10, 0.4, 0.5)
    const many = marginFor(300, 1, 0.5)

    expect(few).toBeGreaterThan(many)
    expect(many).toBeGreaterThanOrEqual(5)
    expect(few).toBeLessThanOrEqual(45)
  })

  it("clamps absurd margins", () => {
    expect(marginFor(1, 0.01, 0.5)).toBe(45)
    expect(marginFor(100_000, 1, 0.5)).toBe(5)
  })
})

describe("timing risk", () => {
  const subject = makeSubject("s", [{ id: "a", weight: 1 }])

  it("computes a median", () => {
    expect(median([])).toBe(0)
    expect(median([30, 10, 20])).toBe(20)
    expect(median([10, 20, 30, 40])).toBe(25)
  })

  it("penalises consistently slow subjects", () => {
    const fast = answersFor("a", 20, 0.8).map((answer) => ({
      ...answer,
      seconds: 40,
    }))
    const slow = fast.map((answer) => ({ ...answer, seconds: 80 }))
    const now = nowAfter(fast)

    const fastProjection = scoreSubject(subject, fast, now)
    const slowProjection = scoreSubject(subject, slow, now)

    expect(fastProjection.timingRisk).toBe(false)
    expect(slowProjection.timingRisk).toBe(true)
    expect(slowProjection.readiness).toBeCloseTo(
      fastProjection.readiness * 0.97,
      6
    )
  })

  it("does not flag a small sample", () => {
    const answers = answersFor("a", 5, 0.8).map((answer) => ({
      ...answer,
      seconds: 120,
    }))
    const projection = scoreSubject(subject, answers, nowAfter(answers))

    expect(projection.timingRisk).toBe(false)
  })
})

describe("aggregate projection", () => {
  it("sums four subject scores onto the 0-400 scale", () => {
    const aggregate = aggregateProjection([
      makeProjection({ readiness: 100 }),
      makeProjection({ readiness: 100 }),
      makeProjection({ readiness: 100 }),
      makeProjection({ readiness: 100 }),
    ])

    expect(aggregate.score).toBe(400)
    expect(aggregate.low).toBe(380)
    expect(aggregate.high).toBe(400)
  })

  it("combines margins in quadrature", () => {
    const aggregate = aggregateProjection([
      makeProjection({ margin: 10 }),
      makeProjection({ margin: 10 }),
      makeProjection({ margin: 10 }),
      makeProjection({ margin: 10 }),
    ])

    expect(aggregate.margin).toBeCloseTo(20, 6)
  })

  it("takes the weakest confidence level", () => {
    const aggregate = aggregateProjection([
      makeProjection({ confidence: "high" }),
      makeProjection({ confidence: "high" }),
      makeProjection({ confidence: "medium" }),
      makeProjection({ confidence: "low" }),
    ])

    expect(aggregate.confidence).toBe("low")
  })

  it("weights coverage by blueprint question count", () => {
    const aggregate = aggregateProjection([
      makeProjection({ blueprintQuestions: 60, coverage: 1 }),
      makeProjection({ blueprintQuestions: 40, coverage: 0.5 }),
      makeProjection({ blueprintQuestions: 40, coverage: 0.5 }),
      makeProjection({ blueprintQuestions: 40, coverage: 0.5 }),
    ])

    expect(aggregate.coverage).toBeCloseTo(120 / 180, 6)
  })

  it("is not projectable unless every subject is", () => {
    const aggregate = aggregateProjection([
      makeProjection({ projectable: true }),
      makeProjection({ projectable: false }),
    ])

    expect(aggregate.projectable).toBe(false)
  })

  it("propagates a timing risk from any subject", () => {
    const aggregate = aggregateProjection([
      makeProjection({ timingRisk: false }),
      makeProjection({ timingRisk: true }),
    ])

    expect(aggregate.timingRisk).toBe(true)
  })
})

describe("best three", () => {
  it("picks the three strongest practised subjects", () => {
    const projections = [
      makeProjection({ subjectId: "a", readiness: 80, attempts: 10 }),
      makeProjection({ subjectId: "b", readiness: 60, attempts: 10 }),
      makeProjection({ subjectId: "c", readiness: 40, attempts: 10 }),
      makeProjection({ subjectId: "d", readiness: 20, attempts: 10 }),
      makeProjection({ subjectId: "unused", readiness: 99, attempts: 0 }),
    ]

    const best = pickBestThree(projections)

    expect(best.map((item) => item.subjectId)).toEqual(["a", "b", "c"])
  })
})

describe("full projection", () => {
  const english = makeSubject(
    "english",
    [
      { id: "eng-a", weight: 0.5 },
      { id: "eng-b", weight: 0.5 },
    ],
    60
  )
  const maths = makeSubject("maths", [
    { id: "math-a", weight: 0.5 },
    { id: "math-b", weight: 0.5 },
  ])
  const physics = makeSubject("physics", [
    { id: "phy-a", weight: 0.5 },
    { id: "phy-b", weight: 0.5 },
  ])
  const chemistry = makeSubject("chemistry", [
    { id: "chem-a", weight: 0.5 },
    { id: "chem-b", weight: 0.5 },
  ])
  const furtherMaths = makeSubject("further-maths", [
    { id: "fmath-a", weight: 1 },
  ])

  const subjects = [english, maths, physics, chemistry, furtherMaths]

  function answersForAll(accuracy: Record<string, number>): Answer[] {
    return subjects.flatMap((subject) =>
      subject.topics.flatMap((topic) =>
        answersFor(topic.id, 20, accuracy[subject.id] ?? 0.5)
      )
    )
  }

  it("builds a projectable 0-400 projection", () => {
    const answers = answersForAll({
      english: 0.8,
      maths: 0.7,
      physics: 0.75,
      chemistry: 0.65,
      "further-maths": 0.9,
    })
    const result = project({
      subjects,
      answers,
      selectedSubjectIds: ["maths", "physics", "chemistry"],
      now: nowAfter(answers),
    })

    expect(result.yourFour.projectable).toBe(true)
    expect(result.yourFour.score).toBeGreaterThan(150)
    expect(result.yourFour.score).toBeLessThanOrEqual(400)
    expect(result.yourFour.low).toBeLessThanOrEqual(result.yourFour.score)
    expect(result.yourFour.high).toBeGreaterThanOrEqual(result.yourFour.score)
    expect(result.scoringModelVersion).toBe(SCORING_MODEL_VERSION)
    expect(result.selected).toHaveLength(3)
  })

  it("uses a stronger unselected subject for the best-three projection", () => {
    const answers = answersForAll({
      english: 0.8,
      maths: 0.55,
      physics: 0.55,
      chemistry: 0.5,
      "further-maths": 0.95,
    })
    const result = project({
      subjects,
      answers,
      selectedSubjectIds: ["maths", "physics", "chemistry"],
      now: nowAfter(answers),
    })

    expect(result.bestThree.subjects[0]?.subjectId).toBe("further-maths")
    expect(result.bestThree.aggregate.score).toBeGreaterThan(
      result.yourFour.score
    )
  })

  it("is deterministic for identical inputs", () => {
    const answers = answersForAll({ english: 0.7, maths: 0.6 })
    const input = {
      subjects,
      answers,
      selectedSubjectIds: ["maths", "physics", "chemistry"],
      now: nowAfter(answers),
    }

    expect(project(input)).toEqual(project(input))
  })

  it("requires exactly three non-English subjects", () => {
    const answers = answersForAll({})

    expect(() =>
      project({
        subjects,
        answers,
        selectedSubjectIds: ["maths", "physics"],
        now: nowAfter(answers),
      })
    ).toThrow(/exactly three/i)
  })

  it("rejects duplicate or unknown subject selections", () => {
    const answers = answersForAll({})

    expect(() =>
      project({
        subjects,
        answers,
        selectedSubjectIds: ["maths", "maths", "physics"],
        now: nowAfter(answers),
      })
    ).toThrow(/exactly three/i)

    expect(() =>
      project({
        subjects,
        answers,
        selectedSubjectIds: ["maths", "physics", "nope"],
        now: nowAfter(answers),
      })
    ).toThrow(/unknown selected subject/i)
  })

  it("requires the English subject to exist", () => {
    const answers = answersForAll({})

    expect(() =>
      project({
        subjects,
        answers,
        englishSubjectId: "missing",
        selectedSubjectIds: ["maths", "physics", "chemistry"],
        now: nowAfter(answers),
      })
    ).toThrow(/unknown english/i)
  })
})
