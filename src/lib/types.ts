/** Shared domain types. */

/**
 * Most options a question may carry. JAMB rows are four-option; the bank
 * also serves a few five-option cloze questions and a two-option row, so the
 * app renders a variable number of choices rather than assuming four.
 */
export const MAX_OPTIONS = 6;

/** One offset mark inside question/option text (Unicode-scalar offsets). */
export interface InlineMark {
  start: number;
  len: number;
  /** The API's tag: `bold`, `italic`, `underline`, `strike`, `image`, ... */
  kind: string;
  /** Image marks only: absolute `https://` figure URL. */
  url?: string;
  /** Image marks only: where the figure sits relative to the text. */
  position?: "above" | "below";
  /** Image marks only: alternative text. */
  alt?: string | null;
}

/**
 * A reading stimulus shared by several questions — one comprehension passage
 * serving five questions, one cloze serving nine.
 *
 * The question only carries the id; the stimulus itself is looked up in the
 * quiz payload's `passages` map.
 */
export interface PublicPassage {
  id: string;
  /** The bank's own label, e.g. "Comprehension", "Cloze", "ReadingText". */
  kind: string | null;
  title: string | null;
  author: string | null;
  text: string;
  inline: InlineMark[];
}

/**
 * A question exactly as the browser may see it: no answer, no explanation.
 *
 * The bank lives in the UTME Lab API; nothing here is persisted by the app.
 */
export interface PublicQuestion {
  id: string;
  exam: string;
  subject: string;
  question: string;
  inline: InlineMark[];
  options: string[];
  optionInline: InlineMark[][];
  year: number;
  section: string | null;
  /**
   * The stimulus this question depends on, when it has one. The passage
   * itself is in the quiz payload's `passages` map, keyed by this id.
   */
  passageId: string | null;
}

/** One subject the question bank serves, and how many rows a quiz can use. */
export interface SubjectSummary {
  slug: string;
  name: string;
  /** Verified, answerable questions available for an attempt. */
  count: number;
  compulsory: boolean;
  icon?: string;
}

export interface Attempt {
  id: number;
  subject: string;
  score: number;
  total: number;
  time_taken: number;
  nickname: string;
  created_at: string;
}

export interface Comment {
  id: number;
  name: string;
  message: string;
  created_at: string;
}

export interface QuizPayload {
  quizId: string;
  /** Display name, e.g. "Use of English". */
  subject: string;
  subjectSlug: string;
  questions: PublicQuestion[];
  /**
   * The stimuli the served questions depend on, keyed by passage id. A
   * question with a `passageId` always has its passage here — a stem without
   * its stimulus is never served.
   */
  passages: Record<string, PublicPassage>;
  /** Seconds allowed for the attempt. */
  duration: number;
}

export interface SubmitResult {
  score: number;
  total: number;
  /** Display name of the subject. */
  subject: string;
  timeTaken: number;
  /** questionId -> correct option index, for the review screen. */
  answers: Record<string, number>;
  /** questionId -> the option the learner picked. */
  chosen: Record<string, number>;
}
