import { computeTopicMastery, clamp } from "./ability"
import {
  COVERAGE_ATTEMPTS_PER_TOPIC,
  COVERAGE_CAP_FLOOR,
  CONFIDENCE_Z,
  DEFAULT_SIGMA,
  EXAM_BLUEPRINT,
  HIGH_COVERAGE_THRESHOLD,
  LOW_ATTEMPTS_THRESHOLD,
  MAX_AGGREGATE_MARGIN,
  MAX_SUBJECT_MARGIN,
  MEDIUM_ATTEMPTS_THRESHOLD,
  MIN_MARGIN,
  RECENT_OUTCOME_WINDOW,
  SCALE_ALPHA,
  SCALE_BETA,
  SCORING_MODEL_VERSION,
  TIMING_MIN_ANSWERS,
  TIMING_PENALTY,
  TIMING_RISK_MULTIPLIER,
} from "./constants"
import type {
  AggregateProjection,
  Answer,
  ConfidenceLevel,
  Projection,
  ScoredTopic,
  Subject,
  SubjectProjection,
  TopicMastery,
} from "./types"

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

/**
 * Ability (logit scale) -> 0-100 score.
 * theta 0 -> 25, theta 1 -> 75, theta 2.5 -> ~99.
 */
export function scaleAbility(theta: number): number {
  return 100 * sigmoid(SCALE_ALPHA * (theta - SCALE_BETA))
}

function weightSum(subject: Subject): number {
  return subject.topics.reduce((sum, topic) => sum + topic.blueprintWeight, 0)
}

/** Blueprint-weighted share of topics with at least 10 attempts. */
export function coverageFor(
  subject: Subject,
  masteries: ReadonlyMap<string, TopicMastery>
): number {
  const total = weightSum(subject)
  if (total <= 0) return 0

  const covered = subject.topics.reduce((sum, topic) => {
    const attempts = masteries.get(topic.id)?.attempts ?? 0
    const fraction = Math.min(attempts / COVERAGE_ATTEMPTS_PER_TOPIC, 1)
    return sum + fraction * topic.blueprintWeight
  }, 0)

  return clamp(covered / total, 0, 1)
}

/** Blueprint-weighted mean of the topic abilities that feed this subject. */
export function subjectTheta(
  subject: Subject,
  masteries: ReadonlyMap<string, TopicMastery>
): number {
  const total = weightSum(subject)
  if (total <= 0) return 0

  const weighted = subject.topics.reduce((sum, topic) => {
    const theta = masteries.get(topic.id)?.theta ?? 0
    return sum + theta * topic.blueprintWeight
  }, 0)

  return weighted / total
}

/**
 * Standard deviation of recent 0/1 outcomes. Used as sigma in the margin
 * formula. Falls back to the maximum (0.5) when there is not enough data.
 */
export function outcomeSigma(answers: readonly Answer[]): number {
  const recent = answers
    .slice()
    .sort((a, b) => b.answeredAt - a.answeredAt)
    .slice(0, RECENT_OUTCOME_WINDOW)

  if (recent.length < 2) return DEFAULT_SIGMA

  const accuracy = recent.filter((answer) => answer.correct).length / recent.length
  const variance = accuracy * (1 - accuracy)
  return clamp(Math.sqrt(variance), 0.05, 0.5)
}

export function marginFor(
  attempts: number,
  coverage: number,
  sigma: number
): number {
  const effectiveN = Math.max(1, attempts * coverage)
  const base = ((CONFIDENCE_Z * sigma) / Math.sqrt(effectiveN)) * 100
  const widened = base * (1 + (1 - coverage))
  return clamp(widened, MIN_MARGIN, MAX_SUBJECT_MARGIN)
}

export function confidenceLevel(
  attempts: number,
  coverage: number
): ConfidenceLevel {
  if (attempts < LOW_ATTEMPTS_THRESHOLD) return "low"
  if (attempts <= MEDIUM_ATTEMPTS_THRESHOLD) return "medium"
  return coverage >= HIGH_COVERAGE_THRESHOLD ? "high" : "medium"
}

/**
 * Score one subject from its full answer history.
 */
export function scoreSubject(
  subject: Subject,
  answers: readonly Answer[],
  now: number
): SubjectProjection {
  const topicIds = new Set(subject.topics.map((topic) => topic.id))
  const subjectAnswers = answers.filter(
    (answer) => topicIds.has(answer.topicId) && answer.answeredAt <= now
  )

  const grouped = new Map<string, Answer[]>()
  for (const answer of subjectAnswers) {
    const bucket = grouped.get(answer.topicId)
    if (bucket) bucket.push(answer)
    else grouped.set(answer.topicId, [answer])
  }

  const topics: ScoredTopic[] = subject.topics.map((topic) => {
    const mastery = computeTopicMastery(
      topic.id,
      grouped.get(topic.id) ?? [],
      now
    )
    return {
      topic,
      mastery,
      masteryScore: scaleAbility(mastery.theta),
    }
  })

  const masteries = new Map(topics.map((item) => [item.topic.id, item.mastery]))
  const coverage = coverageFor(subject, masteries)
  const theta = subjectTheta(subject, masteries)
  const rawReadiness = scaleAbility(theta)
  const cap = COVERAGE_CAP_FLOOR + (100 - COVERAGE_CAP_FLOOR) * coverage

  const attempts = subjectAnswers.length
  const correct = subjectAnswers.filter((answer) => answer.correct).length
  const sigma = outcomeSigma(subjectAnswers)
  const medianSeconds = median(
    subjectAnswers.map((answer) => answer.seconds)
  )
  const timingRisk =
    attempts >= TIMING_MIN_ANSWERS &&
    medianSeconds >
      EXAM_BLUEPRINT.secondsPerQuestion * TIMING_RISK_MULTIPLIER

  const capped = Math.min(rawReadiness, cap)
  const readiness = timingRisk ? capped * (1 - TIMING_PENALTY) : capped

  return {
    subjectId: subject.id,
    name: subject.name,
    blueprintQuestions: subject.blueprintQuestions,
    readiness,
    rawReadiness,
    coverage,
    theta,
    attempts,
    correct,
    accuracy: attempts === 0 ? 0 : correct / attempts,
    medianSeconds,
    timingRisk,
    margin: marginFor(attempts, coverage, sigma),
    confidence: confidenceLevel(attempts, coverage),
    projectable: attempts >= LOW_ATTEMPTS_THRESHOLD,
    topics,
  }
}

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
}

function weakestConfidence(
  levels: readonly ConfidenceLevel[]
): ConfidenceLevel {
  if (levels.length === 0) return "low"
  return levels.reduce((weakest, level) =>
    CONFIDENCE_RANK[level] < CONFIDENCE_RANK[weakest] ? level : weakest
  )
}

/**
 * English is compulsory, so an aggregate is English + three others.
 * Subject scores are 0-100 each, giving the familiar 0-400 UTME scale.
 */
export function aggregateProjection(
  projections: readonly SubjectProjection[]
): AggregateProjection {
  const score = clamp(
    projections.reduce((sum, item) => sum + item.readiness, 0),
    0,
    400
  )

  const margin = clamp(
    Math.sqrt(
      projections.reduce((sum, item) => sum + item.margin ** 2, 0)
    ),
    MIN_MARGIN,
    MAX_AGGREGATE_MARGIN
  )

  const questions = projections.reduce(
    (sum, item) => sum + item.blueprintQuestions,
    0
  )
  const coverage =
    questions === 0
      ? 0
      : projections.reduce(
          (sum, item) => sum + item.coverage * item.blueprintQuestions,
          0
        ) / questions

  return {
    score,
    margin,
    low: Math.max(0, Math.round(score - margin)),
    high: Math.min(400, Math.round(score + margin)),
    coverage,
    confidence: weakestConfidence(
      projections.map((item) => item.confidence)
    ),
    timingRisk: projections.some((item) => item.timingRisk),
    projectable:
      projections.length > 0 && projections.every((item) => item.projectable),
  }
}

/** "Projected (best 3)" ignores weak chosen subjects if better ones exist. */
export function pickBestThree(
  projections: readonly SubjectProjection[]
): SubjectProjection[] {
  return projections
    .filter((item) => item.attempts > 0)
    .slice()
    .sort((a, b) => b.readiness - a.readiness)
    .slice(0, 3)
}

export type ProjectInput = {
  subjects: readonly Subject[]
  answers: readonly Answer[]
  /** English is compulsory in UTME. */
  englishSubjectId?: string
  /** The three non-English subjects the student selected. */
  selectedSubjectIds: readonly string[]
  now: number
}

export function project({
  subjects,
  answers,
  englishSubjectId = "english",
  selectedSubjectIds,
  now,
}: ProjectInput): Projection {
  const byId = new Map(subjects.map((subject) => [subject.id, subject]))
  const englishSubject = byId.get(englishSubjectId)
  if (!englishSubject) {
    throw new Error(`Unknown English subject: ${englishSubjectId}`)
  }

  const selectedIds = [...new Set(selectedSubjectIds)]
  if (selectedIds.length !== 3) {
    throw new Error("UTME requires exactly three non-English subjects")
  }
  if (selectedIds.includes(englishSubjectId)) {
    throw new Error("English is compulsory and cannot be selected twice")
  }

  const english = scoreSubject(englishSubject, answers, now)

  const allOthers = subjects
    .filter((subject) => subject.id !== englishSubjectId)
    .map((subject) => scoreSubject(subject, answers, now))

  const selected = selectedIds.map((id) => {
    const projection = allOthers.find((item) => item.subjectId === id)
    if (!projection) throw new Error(`Unknown selected subject: ${id}`)
    return projection
  })

  const bestThreeSubjects = pickBestThree(allOthers)

  return {
    english,
    selected,
    yourFour: aggregateProjection([english, ...selected]),
    bestThree: {
      subjects: bestThreeSubjects,
      aggregate: aggregateProjection([english, ...bestThreeSubjects]),
    },
    scoringModelVersion: SCORING_MODEL_VERSION,
  }
}
