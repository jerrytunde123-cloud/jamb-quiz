/**
 * Quiz domain logic. All of it runs on the server so that correct answers
 * are never shipped to the browser and scores cannot be forged.
 *
 * The question bank itself is not stored here: it comes from the UTME Lab API
 * at quiz start. Only in-flight sessions (question ids + answer key + option
 * counts), graded attempts, likes and comments live in the database.
 */
import { randomUUID } from "node:crypto";
import { query, queryOne, run, transaction } from "./turso";
import {
  fetchBankVersion,
  listSubjects,
  pickQuestions,
  revalidateQuestionBank,
  slugify,
} from "./utmelab";
import {
  MAX_OPTIONS,
  type Attempt,
  type BankVersionInfo,
  type Comment,
  type QuizPayload,
  type SubjectSummary,
  type SubmitResult,
} from "./types";

/** Questions per attempt (matches the original UTME Lab behaviour). */
export const QUESTIONS_PER_QUIZ = 15;
/** Seconds allowed per attempt. */
export const QUIZ_DURATION_SECONDS = 5 * 60;
/** How long a quiz session stays valid before it is discarded. */
const SESSION_TTL_MINUTES = 30;

/**
 * Every subject the question bank can serve.
 *
 * The home page and the leaderboard render even when the API is unreachable,
 * so a failure degrades to an empty grid instead of a crashed page.
 */
export async function getSubjects(): Promise<SubjectSummary[]> {
  try {
    return await listSubjects();
  } catch (err) {
    console.error(
      "[utmelab] subject list failed:",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

/** Resolve a URL segment (slug or name) to a subject. Case-insensitive. */
export async function resolveSubject(
  slug: string
): Promise<SubjectSummary | null> {
  const subjects = await getSubjects();
  const decoded = decodeURIComponent(slug).trim();
  const wantedSlug = slugify(decoded);
  return (
    subjects.find(
      (s) => s.slug === decoded.toLowerCase() || slugify(s.name) === wantedSlug
    ) ?? null
  );
}

/**
 * Create a quiz session.
 *
 * The questions and their answer key are fetched together from the API. The
 * questions go to the browser; the key is written to the session row and is
 * the only thing grading trusts — so neither the client nor a later API
 * outage can change a result.
 */
export async function createQuiz(
  subject: SubjectSummary
): Promise<QuizPayload | null> {
  const { questions, answerKey, optionCounts, passages } = await pickQuestions(
    subject,
    QUESTIONS_PER_QUIZ
  );
  if (!questions.length) return null;

  const sessionId = randomUUID();

  // The session stores the key *and* each question's option count, so
  // grading can tell an option that exists from one the question never had.
  const stored = JSON.stringify({ answers: answerKey, optionCounts });

  await run(
    `INSERT INTO sessions (session_id, subject, subject_name, answer_key, used, created_at)
     VALUES (?, ?, ?, ?, 0, datetime('now'))`,
    [sessionId, subject.slug, subject.name, stored]
  );

  return {
    quizId: sessionId,
    subject: subject.name,
    subjectSlug: subject.slug,
    questions,
    passages,
    duration: QUIZ_DURATION_SECONDS,
  };
}

/** The grading material a session carries. */
interface StoredKey {
  /** question id -> correct option index. */
  answers: Record<string, number>;
  /** question id -> how many options that question has. */
  optionCounts: Record<string, number>;
}

/**
 * Parse a stored answer key, returning null when it is unusable.
 *
 * The current shape is `{ answers, optionCounts }`. A flat `{ id: index }`
 * object is also accepted, so a session written before the option counts
 * were captured still grades.
 */
function parseAnswerKey(raw: string): StoredKey | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

  const obj = parsed as Record<string, unknown>;
  const nested = obj.answers;
  const source: Record<string, unknown> =
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : obj;
  const countsSource: Record<string, unknown> =
    obj.optionCounts && typeof obj.optionCounts === "object"
      ? (obj.optionCounts as Record<string, unknown>)
      : {};

  const answers: Record<string, number> = {};
  const optionCounts: Record<string, number> = {};
  for (const [id, value] of Object.entries(source)) {
    const index = Number(value);
    // The bank serves four-option rows and a few five-option cloze
    // questions, so the valid range is the widest one, not 0-3.
    if (!Number.isInteger(index) || index < 0 || index >= MAX_OPTIONS) continue;
    answers[id] = index;
    const count = Number(countsSource[id]);
    if (Number.isInteger(count) && count >= 2 && count <= MAX_OPTIONS) {
      optionCounts[id] = count;
    }
  }
  return Object.keys(answers).length ? { answers, optionCounts } : null;
}

/**
 * Grade a submitted attempt.
 *
 * The set of questions is taken from the server-side session, never from the
 * client, so a learner cannot submit answers for questions they were not served.
 */
export async function submitQuiz(input: {
  quizId: string;
  answers: Record<string, number>;
  nickname?: string;
  timeTaken?: number;
  userId?: string | null;
}): Promise<SubmitResult | { error: string }> {
  const { quizId } = input;
  if (!quizId) return { error: "Missing quizId" };

  const session = await queryOne<{
    subject: string;
    subject_name: string;
    answer_key: string;
    used: number;
  }>(
    `SELECT subject, subject_name, answer_key, used
       FROM sessions WHERE session_id = ?`,
    [quizId]
  );
  if (!session) return { error: "Invalid or expired quiz session" };
  if (Number(session.used) === 1) {
    return { error: "This quiz has already been submitted" };
  }

  // Expire old sessions.
  await run(`DELETE FROM sessions WHERE used = 0 AND created_at < datetime('now', ?)`, [
    `-${SESSION_TTL_MINUTES} minutes`,
  ]);

  const key = parseAnswerKey(session.answer_key);
  if (!key) return { error: "Corrupt quiz session" };
  const ids = Object.keys(key.answers);

  const chosen: Record<string, number> = {};
  const answers: Record<string, number> = {};
  let score = 0;

  for (const id of ids) {
    const pick = Number(input.answers?.[id]);
    // A pick outside the question's own options is not an answer, whatever
    // the widest option count in the bank is.
    const limit = key.optionCounts[id] ?? MAX_OPTIONS;
    const valid =
      Number.isInteger(pick) && pick >= 0 && pick < limit ? pick : -1;
    chosen[id] = valid;
    answers[id] = key.answers[id];
    if (valid === key.answers[id]) score++;
  }

  const nickname =
    (input.nickname || "Anonymous").trim().slice(0, 40) || "Anonymous";
  const timeTaken = Math.max(
    0,
    Math.min(Number(input.timeTaken) || 0, 24 * 60 * 60)
  );

  await transaction([
    {
      sql: `INSERT INTO attempts (subject, score, total, time_taken, nickname, user_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        session.subject,
        score,
        ids.length,
        timeTaken,
        nickname,
        input.userId ?? null,
      ],
    },
    {
      sql: `UPDATE sessions SET used = 1 WHERE session_id = ?`,
      args: [quizId],
    },
  ]);

  return {
    score,
    total: ids.length,
    subject: session.subject_name || session.subject,
    timeTaken,
    answers,
    chosen,
  };
}

/** Top attempts for a subject slug. */
export async function getLeaderboard(
  subject: string,
  limit = 20
): Promise<Attempt[]> {
  const rows = await query<{
    id: number;
    subject: string;
    score: number;
    total: number;
    time_taken: number;
    nickname: string;
    created_at: string;
  }>(
    `SELECT id, subject, score, total, time_taken, nickname, created_at
       FROM attempts
      WHERE subject = ?
      ORDER BY score DESC, time_taken ASC, created_at ASC
      LIMIT ?`,
    [subject, limit]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    subject: r.subject,
    score: Number(r.score),
    total: Number(r.total),
    time_taken: Number(r.time_taken),
    nickname: r.nickname,
    created_at: r.created_at,
  }));
}

/** Attempts + likes for a subject slug. */
export async function getStats(
  subject: string
): Promise<{ attempts: number; likes: number }> {
  const a = await queryOne<{ c: number }>(
    `SELECT COUNT(*) AS c FROM attempts WHERE subject = ?`,
    [subject]
  );
  const l = await queryOne<{ count: number }>(
    `SELECT count FROM likes WHERE subject = ?`,
    [subject]
  );
  return {
    attempts: Number(a?.c ?? 0),
    likes: Number(l?.count ?? 0),
  };
}

/** Increment (once per browser session) the like counter for a subject. */
export async function likeSubject(subject: string): Promise<number> {
  await run(
    `INSERT INTO likes (subject, count) VALUES (?, 1)
     ON CONFLICT(subject) DO UPDATE SET count = count + 1`,
    [subject]
  );
  const row = await queryOne<{ count: number }>(
    `SELECT count FROM likes WHERE subject = ?`,
    [subject]
  );
  return Number(row?.count ?? 0);
}

/** Recent comments for a subject slug. */
export async function getComments(
  subject: string,
  limit = 50
): Promise<Comment[]> {
  const rows = await query<{
    id: number;
    name: string;
    message: string;
    created_at: string;
  }>(
    `SELECT id, name, message, created_at FROM comments
      WHERE subject = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ?`,
    [subject, limit]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    message: r.message,
    created_at: r.created_at,
  }));
}

/** Add a comment. */
export async function addComment(input: {
  subject: string;
  name?: string;
  message: string;
  userId?: string | null;
}): Promise<{ error: string } | { ok: true }> {
  const message = (input.message ?? "").trim();
  if (!message) return { error: "Empty message" };
  if (message.length > 400) {
    return { error: "Message is too long (max 400 characters)" };
  }

  const name = (input.name || "Guest").trim().slice(0, 40) || "Guest";

  await run(
    `INSERT INTO comments (subject, name, message, user_id, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [input.subject ?? "", name, message, input.userId ?? null]
  );
  return { ok: true };
}

export interface AdminStats {
  totalAttempts: number;
  totalComments: number;
  totalLikes: number;
  cacheEntries: number;
  subjectAttempts: Array<{ subject: string; count: number; avg_score: number }>;
  bankVersion?: BankVersionInfo | null;
}

export { fetchBankVersion, revalidateQuestionBank };

/** Dashboard statistics for administrative overview. */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const [attempts, comments, likes, cacheEntries, subjectAttempts, bankVersion] =
      await Promise.all([
        queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM attempts`),
        queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM comments`),
        queryOne<{ s: number }>(`SELECT COALESCE(SUM(count), 0) AS s FROM likes`),
        queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM app_cache`),
        query<{ subject: string; count: number; avg_score: number }>(
          `SELECT LOWER(subject) AS subject, COUNT(*) AS count, ROUND(AVG(score), 1) AS avg_score 
           FROM attempts GROUP BY LOWER(subject) ORDER BY count DESC LIMIT 20`
        ),
        fetchBankVersion().catch(() => null),
      ]);

    const catalog = await getSubjects().catch(() => []);
    const nameMap = new Map<string, string>();
    for (const s of catalog) {
      nameMap.set(s.slug.toLowerCase(), s.name);
    }

    return {
      totalAttempts: Number(attempts?.c ?? 0),
      totalComments: Number(comments?.c ?? 0),
      totalLikes: Number(likes?.s ?? 0),
      cacheEntries: Number(cacheEntries?.c ?? 0),
      bankVersion,
      subjectAttempts: subjectAttempts.map((r) => {
        const rawSlug = r.subject.toLowerCase();
        const displayName =
          nameMap.get(rawSlug) ||
          rawSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return {
          subject: displayName,
          count: Number(r.count),
          avg_score: Number(r.avg_score || 0),
        };
      }),
    };
  } catch (err) {
    console.error("[admin] getAdminStats error:", err);
    return {
      totalAttempts: 0,
      totalComments: 0,
      totalLikes: 0,
      cacheEntries: 0,
      bankVersion: null,
      subjectAttempts: [],
    };
  }
}
