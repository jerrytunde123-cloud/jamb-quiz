/**
 * Tunable constants for the readiness engine.
 *
 * Every constant here is part of the scoring model. Changing one changes
 * historical projections, so bump SCORING_MODEL_VERSION when you do.
 */
export const SCORING_MODEL_VERSION = "readiness-0.1.0"

/** Ability is on the same logit scale as question difficulty. */
export const ABILITY_PRIOR = 0
export const THETA_MIN = -6
export const THETA_MAX = 6

export const DIFFICULTY_MIN = -3
export const DIFFICULTY_MAX = 3

/** Elo-lite K-factor. High while the model is still learning the student. */
export const K_INITIAL = 0.4
export const K_STABLE = 0.15
export const K_PLATEAU_ATTEMPTS = 20
export const K_DECAY_ATTEMPTS = 20

/** Forgetting curve time constant, in days. */
export const DECAY_TAU_DAYS = 21

/** A topic counts as "covered" after this many attempts. */
export const COVERAGE_ATTEMPTS_PER_TOPIC = 10
/** readiness <= CAP_FLOOR + (100 - CAP_FLOOR) * coverage */
export const COVERAGE_CAP_FLOOR = 50

/**
 * Subject scaling: 100 * sigmoid(ALPHA * (theta - BETA)).
 * Calibrated so theta 0 -> 25, theta 1 -> 75.
 */
export const SCALE_ALPHA = Math.log(9)
export const SCALE_BETA = 0.5

/** Confidence interval. z = 1.64 is a 90% interval. */
export const CONFIDENCE_Z = 1.64
export const DEFAULT_SIGMA = 0.5
export const MIN_MARGIN = 5
export const MAX_SUBJECT_MARGIN = 45
export const MAX_AGGREGATE_MARGIN = 60
export const RECENT_OUTCOME_WINDOW = 30

/** Confidence labels, per the product spec. */
export const LOW_ATTEMPTS_THRESHOLD = 20
export const MEDIUM_ATTEMPTS_THRESHOLD = 60
export const HIGH_COVERAGE_THRESHOLD = 0.6

/** Guessing heuristic. */
export const GUESS_MAX_SECONDS = 5
export const GUESS_CHANGES_THRESHOLD = 2
export const GUESS_DISCOUNT = 0.5

/** UTME exam blueprint. */
export const EXAM_BLUEPRINT = {
  englishQuestions: 60,
  otherSubjectQuestions: 40,
  totalQuestions: 180,
  durationMinutes: 120,
  secondsPerQuestion: 45,
} as const

/** A median slower than 1.5x the exam pace is a timing risk. */
export const TIMING_RISK_MULTIPLIER = 1.5
/** Small multiplicative penalty, applied after the coverage cap. */
export const TIMING_PENALTY = 0.03
/** Do not flag timing until there is a reasonable sample. */
export const TIMING_MIN_ANSWERS = 10

/** UI banding. Not part of the score itself. */
export const BAND_THRESHOLDS = {
  strong: 60,
  onTrack: 45,
} as const

export const MS_PER_DAY = 86_400_000
