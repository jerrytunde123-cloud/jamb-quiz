import {
  ABILITY_PRIOR,
  DECAY_TAU_DAYS,
  DIFFICULTY_MAX,
  DIFFICULTY_MIN,
  GUESS_CHANGES_THRESHOLD,
  GUESS_DISCOUNT,
  GUESS_MAX_SECONDS,
  K_DECAY_ATTEMPTS,
  K_INITIAL,
  K_PLATEAU_ATTEMPTS,
  K_STABLE,
  MS_PER_DAY,
  THETA_MAX,
  THETA_MIN,
} from "./constants"
import type { Answer, TopicMastery } from "./types"

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Standard Elo expectation, on the -3..+3 difficulty scale. */
export function expectedCorrect(theta: number, difficulty: number): number {
  const d = clamp(difficulty, DIFFICULTY_MIN, DIFFICULTY_MAX)
  return 1 / (1 + 10 ** (-(theta - d) / 2))
}

/**
 * K starts at 0.40 and decays toward 0.15 once the student has 20 answers.
 * The first 20 answers therefore move the estimate quickly.
 */
export function kFactor(attempts: number): number {
  if (attempts < K_PLATEAU_ATTEMPTS) return K_INITIAL
  const decay = Math.exp(-(attempts - K_PLATEAU_ATTEMPTS) / K_DECAY_ATTEMPTS)
  return K_STABLE + (K_INITIAL - K_STABLE) * decay
}

/**
 * A correct answer in under 5 seconds with at least 2 option changes is
 * treated as a probable guess.
 */
export function isGuess(seconds: number, changedCount = 0): boolean {
  return seconds < GUESS_MAX_SECONDS && changedCount >= GUESS_CHANGES_THRESHOLD
}

export type ThetaUpdateInput = {
  theta: number
  attempts: number
  correct: boolean
  difficulty: number
  seconds: number
  changedCount?: number
}

export type ThetaUpdate = {
  theta: number
  expected: number
  outcome: number
  guess: boolean
}

/**
 * One Elo-lite update. Guessed-correct answers count as half a success,
 * so lucky answers cannot inflate ability.
 */
export function updateTheta(input: ThetaUpdateInput): ThetaUpdate {
  const expected = expectedCorrect(input.theta, input.difficulty)
  const guess =
    input.correct && isGuess(input.seconds, input.changedCount ?? 0)
  const outcome = input.correct ? (guess ? GUESS_DISCOUNT : 1) : 0
  const next = input.theta + kFactor(input.attempts) * (outcome - expected)

  return {
    theta: clamp(next, THETA_MIN, THETA_MAX),
    expected,
    outcome,
    guess,
  }
}

/**
 * Lazy forgetting curve:
 *   theta_effective = prior + (theta - prior) * exp(-deltaDays / tau)
 * Returns the prior when there is no attempt history.
 */
export function decayTheta(
  theta: number,
  lastAttemptAt: number | null,
  now: number,
  prior = ABILITY_PRIOR,
  tauDays = DECAY_TAU_DAYS
): number {
  if (lastAttemptAt === null) return prior
  const deltaDays = Math.max(0, (now - lastAttemptAt) / MS_PER_DAY)
  return prior + (theta - prior) * Math.exp(-deltaDays / tauDays)
}

/**
 * Replay one topic's answers in chronological order.
 *
 * `answers` may contain other topics; they are filtered out. The input array
 * is never mutated.
 */
export function computeTopicMastery(
  topicId: string,
  answers: readonly Answer[],
  now: number
): TopicMastery {
  const ordered = answers
    .filter((answer) => answer.topicId === topicId)
    .slice()
    .sort((a, b) => a.answeredAt - b.answeredAt)

  let theta = ABILITY_PRIOR
  let correct = 0
  let lastAttemptAt: number | null = null

  for (const [index, answer] of ordered.entries()) {
    const update = updateTheta({
      theta,
      attempts: index,
      correct: answer.correct,
      difficulty: answer.difficulty,
      seconds: answer.seconds,
      changedCount: answer.changedCount,
    })
    theta = update.theta
    if (answer.correct) correct += 1
    lastAttemptAt = answer.answeredAt
  }

  return {
    topicId,
    theta: decayTheta(theta, lastAttemptAt, now),
    rawTheta: theta,
    attempts: ordered.length,
    correct,
    accuracy: ordered.length === 0 ? 0 : correct / ordered.length,
    lastAttemptAt,
  }
}
