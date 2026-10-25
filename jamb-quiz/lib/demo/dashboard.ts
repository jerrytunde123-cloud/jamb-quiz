import {
  project,
  type ConfidenceLevel,
  type SubjectProjection,
} from "../readiness"

import { DEMO_ATTEMPTS, DEMO_NOW } from "./attempts"
import { DEMO_PROFILE, demoSubjects } from "./catalog"

export type ReadinessBand = "strong" | "on-track" | "at-risk"

export type SubjectReadiness = {
  id: string
  name: string
  readiness: number
  previousReadiness: number
  accuracy: number
  questionsAttempted: number
  timingRisk: boolean
  band: ReadinessBand
}

export type WeakTopic = {
  id: string
  topic: string
  subject: string
  accuracy: number
  attempts: number
  /** Weighted by blueprint share and exam question count. */
  expectedMarksLost: number
}

export type Dashboard = {
  projected: {
    score: number
    max: number
    low: number
    high: number
    margin: number
    goal: number
    lastWeekScore: number
    sinceLastWeek: number
    lastMonthScore: number
    sinceLastMonth: number
    coverage: number
    confidence: ConfidenceLevel
    confidenceLabel: string
    confidenceNote: string
    timingRisk: boolean
    projectable: boolean
    modelVersion: string
  }
  subjects: SubjectReadiness[]
  weakTopics: WeakTopic[]
}

const MS_PER_DAY = 86_400_000

const CONFIDENCE_COPY: Record<
  ConfidenceLevel,
  { label: string; note: string }
> = {
  low: {
    label: "Low confidence",
    note: "Still learning you. Trust the range, not the number.",
  },
  medium: {
    label: "Medium confidence",
    note: "Enough evidence to trend, not enough to be precise.",
  },
  high: {
    label: "High confidence",
    note: "Broad coverage and a stable recent history.",
  },
}

function bandFor(readiness: number): ReadinessBand {
  if (readiness >= 60) return "strong"
  if (readiness >= 45) return "on-track"
  return "at-risk"
}

function indexById(
  projections: readonly SubjectProjection[]
): Map<string, SubjectProjection> {
  return new Map(projections.map((item) => [item.subjectId, item]))
}

/**
 * Builds the dashboard from the real engine. `now` is fixed so the static
 * build is deterministic and repeatable.
 */
export function buildDemoDashboard(now = DEMO_NOW): Dashboard {
  const current = project({
    subjects: demoSubjects,
    answers: DEMO_ATTEMPTS,
    englishSubjectId: DEMO_PROFILE.englishSubjectId,
    selectedSubjectIds: DEMO_PROFILE.selectedSubjectIds,
    now,
  })

  const lastWeek = project({
    subjects: demoSubjects,
    answers: DEMO_ATTEMPTS,
    englishSubjectId: DEMO_PROFILE.englishSubjectId,
    selectedSubjectIds: DEMO_PROFILE.selectedSubjectIds,
    now: now - 7 * MS_PER_DAY,
  })

  const prior = project({
    subjects: demoSubjects,
    answers: DEMO_ATTEMPTS,
    englishSubjectId: DEMO_PROFILE.englishSubjectId,
    selectedSubjectIds: DEMO_PROFILE.selectedSubjectIds,
    now: now - 30 * MS_PER_DAY,
  })

  const priorById = indexById([prior.english, ...prior.selected])
  const currentSubjects = [current.english, ...current.selected]

  const subjects: SubjectReadiness[] = currentSubjects.map((subject) => {
    const previous = priorById.get(subject.subjectId)
    const readiness = Math.round(subject.readiness)

    return {
      id: subject.subjectId,
      name: subject.name,
      readiness,
      previousReadiness: Math.round(previous?.readiness ?? 0),
      accuracy: Math.round(subject.accuracy * 100),
      questionsAttempted: subject.attempts,
      timingRisk: subject.timingRisk,
      band: bandFor(readiness),
    }
  })

  const weakTopics: WeakTopic[] = currentSubjects
    .flatMap((subject) =>
      subject.topics.map(({ topic, mastery, masteryScore }) => ({
        id: topic.id,
        topic: topic.name,
        subject: subject.name,
        accuracy: Math.round(mastery.accuracy * 100),
        attempts: mastery.attempts,
        expectedMarksLost:
          (100 - masteryScore) *
          topic.blueprintWeight *
          (subject.blueprintQuestions / 40),
      }))
    )
    .filter((topic) => topic.attempts > 0)
    .sort((a, b) => b.expectedMarksLost - a.expectedMarksLost)
    .slice(0, 3)
    .map((topic) => ({
      ...topic,
      expectedMarksLost: Math.round(topic.expectedMarksLost * 10) / 10,
    }))

  const confidence = CONFIDENCE_COPY[current.yourFour.confidence]

  return {
    projected: {
      score: Math.round(current.yourFour.score),
      max: 400,
      low: current.yourFour.low,
      high: current.yourFour.high,
      margin: Math.round(current.yourFour.margin * 10) / 10,
      goal: 280,
      lastWeekScore: Math.round(lastWeek.yourFour.score),
      sinceLastWeek: Math.round(
        current.yourFour.score - lastWeek.yourFour.score
      ),
      lastMonthScore: Math.round(prior.yourFour.score),
      sinceLastMonth: Math.round(
        current.yourFour.score - prior.yourFour.score
      ),
      coverage: Math.round(current.yourFour.coverage * 100),
      confidence: current.yourFour.confidence,
      confidenceLabel: confidence.label,
      confidenceNote: confidence.note,
      timingRisk: current.yourFour.timingRisk,
      projectable: current.yourFour.projectable,
      modelVersion: current.scoringModelVersion,
    },
    subjects,
    weakTopics,
  }
}
