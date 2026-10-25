export type Topic = {
  id: string
  subjectId: string
  name: string
  /** Share of the subject blueprint. Weights for one subject should sum to 1. */
  blueprintWeight: number
}

export type Subject = {
  id: string
  name: string
  /** Real exam question count: 60 for English, 40 for others. */
  blueprintQuestions: number
  topics: readonly Topic[]
}

export type Answer = {
  topicId: string
  correct: boolean
  /** Calibrated question difficulty, -3..+3. */
  difficulty: number
  /** Time spent on the question, in seconds. */
  seconds: number
  /** How many times the selected option changed before submitting. */
  changedCount?: number
  /** Epoch milliseconds. */
  answeredAt: number
}

export type TopicMastery = {
  topicId: string
  /** Ability after recency decay. This is what scoring uses. */
  theta: number
  /** Ability immediately after the last answer, before decay. */
  rawTheta: number
  attempts: number
  correct: number
  accuracy: number
  lastAttemptAt: number | null
}

export type ScoredTopic = {
  topic: Topic
  mastery: TopicMastery
  /** 0-100 mastery, using the same curve as subject readiness. */
  masteryScore: number
}

export type ConfidenceLevel = "low" | "medium" | "high"

export type SubjectProjection = {
  subjectId: string
  name: string
  blueprintQuestions: number
  /** 0-100, after the coverage cap. */
  readiness: number
  /** 0-100, before the coverage cap. */
  rawReadiness: number
  /** Blueprint-weighted topic coverage, 0-1. */
  coverage: number
  /** Blueprint-weighted mean topic ability. */
  theta: number
  attempts: number
  correct: number
  accuracy: number
  /** Median seconds per question in this subject. */
  medianSeconds: number
  /** True when median pace exceeds 1.5x the UTME benchmark. */
  timingRisk: boolean
  margin: number
  confidence: ConfidenceLevel
  /** False until there is enough evidence to show a number at all. */
  projectable: boolean
  topics: readonly ScoredTopic[]
}

export type AggregateProjection = {
  score: number
  margin: number
  low: number
  high: number
  coverage: number
  confidence: ConfidenceLevel
  timingRisk: boolean
  projectable: boolean
}

export type Projection = {
  english: SubjectProjection
  selected: readonly SubjectProjection[]
  yourFour: AggregateProjection
  bestThree: {
    subjects: readonly SubjectProjection[]
    aggregate: AggregateProjection
  }
  scoringModelVersion: string
}
