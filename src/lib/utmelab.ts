/**
 * UTME Lab question API client.
 *
 * Talks to https://api.utmelab.com/api/v1 for the live question bank,
 * subjects catalog, and comprehension passages.
 */
import dns from "node:dns";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { safeQueryOne, run } from "./turso";
import { getSubjectIcon, sortSubjects } from "./subjects";
import type {
  InlineMark,
  PublicPassage,
  PublicQuestion,
  SubjectSummary,
} from "./types";

/* -------------------- IPv4-first DNS Resolution -------------------- */
// Some networks advertise unreachable IPv6 routes (e.g. NAT64 prefixes),
// causing Node's default happy-eyeballs fetch to time out.
// Resolve IPv4 first, falling back to IPv6.
const origLookup = dns.lookup;
if (!(dns as unknown as { __ipv4FirstPatched?: boolean }).__ipv4FirstPatched) {
  (dns as unknown as { __ipv4FirstPatched?: boolean }).__ipv4FirstPatched = true;
  // @ts-expect-error override lookup with IPv4-first fallback
  dns.lookup = function (
    hostname: string,
    options: dns.LookupOptions | number | ((...args: unknown[]) => void),
    callback?: (...args: unknown[]) => void
  ) {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    const cb = callback!;
    const opts = typeof options === "number" ? { family: options } : { ...options };

    if (opts.all) {
      origLookup(hostname, { ...opts, family: 4 }, (err, addresses) => {
        if (!err && Array.isArray(addresses) && addresses.length > 0) {
          return cb(null, addresses);
        }
        return origLookup(hostname, opts, cb as (err: NodeJS.ErrnoException | null, address: dns.LookupAddress[]) => void);
      });
    } else {
      origLookup(hostname, { ...opts, family: 4 }, (err, address, family) => {
        if (!err && address) {
          return cb(null, address, family);
        }
        return origLookup(hostname, opts, cb as (err: NodeJS.ErrnoException | null, address: string, family: number) => void);
      });
    }
  };
}

/* -------------------------- Configuration -------------------------- */
const BASE_URL = (
  process.env.UTMELAB_API_URL ?? "https://api.utmelab.com/api/v1"
).replace(/\/+$/, "");
const EXAM = process.env.UTMELAB_EXAM ?? "JAMB";
const API_KEY = process.env.UTMELAB_API_KEY ?? "";
const PAGE_SIZE = 200;
const TIMEOUT_MS = 15_000;
const PASSAGE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class UtmeLabError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "UtmeLabError";
    this.status = status;
  }
}

/* ------------------------------- HTTP ------------------------------- */
async function getJson<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
  opts: { keyed?: boolean } = {}
): Promise<T> {
  const url = new URL(BASE_URL + path);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const headers: Record<string, string> = {
    accept: "application/json",
  };

  if (opts.keyed) {
    if (!API_KEY) {
      throw new UtmeLabError(
        "UTMELAB_API_KEY is not set — cannot fetch questions."
      );
    }
    headers["x-api-key"] = API_KEY;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new UtmeLabError(
      `Question API unreachable: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!res.ok) {
    const retryAfter = res.headers.get("retry-after");
    const suffix =
      res.status === 429 && retryAfter ? ` (retry after ${retryAfter}s)` : "";
    throw new UtmeLabError(
      `Question API ${res.status} for ${url.pathname}${suffix}`,
      res.status
    );
  }

  return (await res.json()) as T;
}

/* ------------------------------ Slugify ------------------------------ */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ------------------------------ Subjects ------------------------------ */
const CACHE_KEY = "subjects_catalog";
const DISK_CACHE_FILE = path.join(process.cwd(), "db", "subjects-cache.json");

let subjectCache: SubjectSummary[] | null = null;

async function loadSubjectsFromDb(): Promise<SubjectSummary[] | null> {
  try {
    const row = await safeQueryOne<{ value: string }>(
      `SELECT value FROM app_cache WHERE key = ?`,
      [CACHE_KEY]
    );
    if (row?.value) {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("[cache] failed to read subjects from db:", err);
  }
  return null;
}

async function loadSubjectsFromDisk(): Promise<SubjectSummary[] | null> {
  try {
    if (existsSync(DISK_CACHE_FILE)) {
      const text = await readFile(DISK_CACHE_FILE, "utf8");
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("[cache] failed to read subjects from disk:", err);
  }
  return null;
}

async function persistSubjectsToCaches(subjects: SubjectSummary[]): Promise<void> {
  const json = JSON.stringify(subjects);
  try {
    await run(
      `INSERT INTO app_cache (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      [CACHE_KEY, json]
    );
  } catch (err) {
    console.warn("[cache] failed to save subjects to db:", err);
  }

  try {
    await writeFile(DISK_CACHE_FILE, json, "utf8");
  } catch (err) {
    console.warn("[cache] failed to save subjects to disk:", err);
  }
}

interface ExamResponse {
  code: string;
  name: string;
  subjects: {
    slug: string;
    name: string;
    is_compulsory: boolean;
    held: number;
    verified: number;
  }[];
}

/**
 * List all available subjects with persistent, forever-like multi-layer caching:
 *  1. Memory cache (0ms)
 *  2. Database table (app_cache)
 *  3. Local disk snapshot (db/subjects-cache.json)
 *  4. External UTME Lab API (only if all caches are empty or forceRefresh=true)
 */
export async function listSubjects(forceRefresh = false): Promise<SubjectSummary[]> {
  if (!forceRefresh && subjectCache && subjectCache.length > 0) {
    return subjectCache;
  }

  if (!forceRefresh) {
    const fromDb = await loadSubjectsFromDb();
    if (fromDb && fromDb.length > 0) {
      subjectCache = fromDb;
      return fromDb;
    }

    const fromDisk = await loadSubjectsFromDisk();
    if (fromDisk && fromDisk.length > 0) {
      subjectCache = fromDisk;
      void persistSubjectsToCaches(fromDisk);
      return fromDisk;
    }
  }

  try {
    const exams = await getJson<ExamResponse[]>("/public/exams");
    const exam = exams.find((e) => e.code === EXAM);
    if (!exam) {
      throw new UtmeLabError(`The question bank has no exam code ${EXAM}.`);
    }

    const subjects: SubjectSummary[] = exam.subjects
      .map((s) => ({
        slug: s.slug,
        name: s.name,
        count: s.verified ?? s.held ?? 0,
        compulsory: Boolean(s.is_compulsory),
        icon: getSubjectIcon(s.slug),
      }))
      .filter((s) => s.count > 0);

    const sorted = sortSubjects(subjects);
    subjectCache = sorted;
    void persistSubjectsToCaches(sorted);
    return sorted;
  } catch (apiErr) {
    const fallback = (await loadSubjectsFromDisk()) ?? (await loadSubjectsFromDb());
    if (fallback && fallback.length > 0) {
      subjectCache = fallback;
      return fallback;
    }
    throw apiErr;
  }
}

export async function resolveSubject(
  slug: string
): Promise<SubjectSummary | null> {
  const subjects = await listSubjects();
  const decoded = decodeURIComponent(slug).trim();
  const wanted = slugify(decoded);
  return (
    subjects.find(
      (s) => s.slug === decoded.toLowerCase() || slugify(s.name) === wanted
    ) ?? null
  );
}

/* ---------------------------- Inline Marks ---------------------------- */
interface RawText {
  text?: string;
  inline?: {
    start?: number;
    len?: number;
    kind?: string;
    url?: string;
    position?: string;
    alt?: string | null;
  }[];
}

function parseInlineMarks(rawText: RawText | string | null | undefined): {
  marks: InlineMark[];
  valid: boolean;
} {
  if (!rawText || typeof rawText === "string") {
    return { marks: [], valid: true };
  }

  const rawMarks = rawText.inline;
  if (!Array.isArray(rawMarks)) {
    return { marks: [], valid: true };
  }

  const marks: InlineMark[] = [];
  for (const m of rawMarks) {
    if (!m || !m.kind) continue;
    const kind = String(m.kind);
    if (kind === "image") {
      // Image marks must have an absolute https url
      if (typeof m.url !== "string" || !m.url.startsWith("https://")) {
        return { marks: [], valid: false }; // malformed image mark
      }
      marks.push({
        start: Number(m.start) || 0,
        len: Number(m.len) || 0,
        kind: "image",
        url: m.url,
        position: m.position === "below" ? "below" : "above",
        alt: m.alt ?? null,
      });
    } else {
      marks.push({
        start: Number(m.start) || 0,
        len: Number(m.len) || 0,
        kind,
      });
    }
  }

  return { marks, valid: true };
}

/* ------------------------------ Passages ------------------------------ */
const passageCache = new Map<string, { at: number; passage: PublicPassage | null }>();
const passageInFlight = new Map<string, Promise<PublicPassage | null>>();

interface RawPassage {
  id: string;
  exam: string;
  subject: string;
  year?: number;
  kind?: string | null;
  title?: string | null;
  author?: string | null;
  text?: RawText | string;
}

export async function fetchPassage(id: string): Promise<PublicPassage | null> {
  const cached = passageCache.get(id);
  if (cached && Date.now() - cached.at < PASSAGE_TTL_MS) {
    return cached.passage;
  }

  const existing = passageInFlight.get(id);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const raw = await getJson<RawPassage>(`/passages/${encodeURIComponent(id)}`, {}, { keyed: true });
      if (!raw || !raw.id) return null;

      const textStr =
        typeof raw.text === "string" ? raw.text.trim() : (raw.text?.text?.trim() ?? "");
      if (!textStr) return null;

      const { marks, valid } = parseInlineMarks(raw.text);
      if (!valid) return null;

      const passage: PublicPassage = {
        id: raw.id,
        kind: raw.kind ?? null,
        title: raw.title ?? null,
        author: raw.author ?? null,
        text: textStr,
        inline: marks,
      };

      passageCache.set(id, { at: Date.now(), passage });
      return passage;
    } catch (err) {
      console.warn(`[utmelab] failed to fetch passage ${id}:`, err);
      return null;
    } finally {
      passageInFlight.delete(id);
    }
  })();

  passageInFlight.set(id, promise);
  return promise;
}

/* ---------------------------- Normalisation ---------------------------- */
interface RawOption {
  id: string;
  text?: RawText | string;
}

interface RawQuestion {
  id: string;
  exam: string;
  subject: string;
  year?: number;
  text?: RawText | string;
  options?: RawOption[];
  section?: string | null;
  answer?: string;
  passage_id?: string | null;
  verified?: boolean;
}

interface NormalisedCandidate {
  question: PublicQuestion;
  correct: number;
}

function toPublicQuestion(
  raw: RawQuestion,
  subjectName: string
): NormalisedCandidate | null {
  if (!raw || typeof raw.id !== "string" || !raw.id) return null;

  const stem =
    typeof raw.text === "string" ? raw.text.trim() : (raw.text?.text?.trim() ?? "");
  if (!stem) return null;

  const stemMarks = parseInlineMarks(raw.text);
  if (!stemMarks.valid) return null;

  // Options count between 2 and 6
  if (!Array.isArray(raw.options) || raw.options.length < 2 || raw.options.length > 6) {
    return null;
  }

  const options: string[] = [];
  const optionInline: InlineMark[][] = [];
  const optionIds: string[] = [];

  for (const opt of raw.options) {
    const text =
      typeof opt?.text === "string" ? opt.text.trim() : (opt?.text?.text?.trim() ?? "");
    if (!text) return null;

    const optMarks = parseInlineMarks(opt.text);
    if (!optMarks.valid) return null;

    options.push(text);
    optionInline.push(optMarks.marks);
    optionIds.push(String(opt.id ?? ""));
  }

  const correct = optionIds.indexOf(String(raw.answer ?? ""));
  if (correct < 0 || correct >= options.length) return null;

  return {
    question: {
      id: raw.id,
      exam: raw.exam || EXAM,
      subject: subjectName,
      question: stem,
      inline: stemMarks.marks,
      options,
      optionInline,
      year: Number(raw.year) || 0,
      section: raw.section ?? null,
      passageId: raw.passage_id ? String(raw.passage_id) : null,
    },
    correct,
  };
}

/* ------------------------- Question Retrieval ------------------------- */
interface QuestionsResponse {
  questions: RawQuestion[];
  page: number;
  per_page: number;
  total_pages: number;
  total_records: number;
}

async function questionsPage(slug: string, page: number): Promise<QuestionsResponse> {
  return getJson<QuestionsResponse>(
    "/questions",
    {
      exam: EXAM,
      subject: slug,
      verified: true,
      include_explanation: true,
      page,
      per_page: PAGE_SIZE,
    },
    { keyed: true }
  );
}

function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface QuestionPool {
  candidates: NormalisedCandidate[];
  passages: Record<string, PublicPassage>;
}

const poolCache = new Map<string, QuestionPool>();
const inFlightPool = new Map<string, Promise<QuestionPool>>();

async function loadSubjectPool(subject: SubjectSummary): Promise<QuestionPool> {
  const cached = poolCache.get(subject.slug);
  if (cached && cached.candidates.length > 0) {
    return cached;
  }

  // Check DB app_cache for cached pool
  const dbRow = await safeQueryOne<{ value: string }>(
    `SELECT value FROM app_cache WHERE key = ?`,
    [`pool_${subject.slug}`]
  );
  if (dbRow?.value) {
    try {
      const parsed = JSON.parse(dbRow.value) as QuestionPool;
      if (parsed && Array.isArray(parsed.candidates) && parsed.candidates.length > 0) {
        poolCache.set(subject.slug, parsed);
        return parsed;
      }
    } catch {
      /* ignore corrupted cache */
    }
  }

  // Deduplicate concurrent fetches for the same subject
  const existing = inFlightPool.get(subject.slug);
  if (existing) return existing;

  const fetchPromise = (async () => {
    try {
      const first = await questionsPage(subject.slug, 1);
      const pages: QuestionsResponse[] = [first];

      if (first.total_pages > 1) {
        const otherPages = await Promise.all(
          Array.from({ length: first.total_pages - 1 }, (_, i) =>
            questionsPage(subject.slug, i + 2)
          )
        );
        pages.push(...otherPages);
      }

      const seen = new Set<string>();
      const rawCandidates: NormalisedCandidate[] = [];

      for (const raw of pages.flatMap((p) => p.questions ?? [])) {
        if (!raw || seen.has(raw.id)) continue;
        seen.add(raw.id);
        const normalised = toPublicQuestion(raw, subject.name);
        if (normalised) rawCandidates.push(normalised);
      }

      // Fetch all needed passages for this subject
      const neededPassageIds = Array.from(
        new Set(
          rawCandidates
            .map((c) => c.question.passageId)
            .filter((id): id is string => Boolean(id))
        )
      );

      const passagesMap: Record<string, PublicPassage> = {};
      if (neededPassageIds.length > 0) {
        const results = await Promise.all(
          neededPassageIds.map(async (id) => {
            const passage = await fetchPassage(id);
            return { id, passage };
          })
        );
        for (const { id, passage } of results) {
          if (passage && passage.text.trim()) {
            passagesMap[id] = passage;
          }
        }
      }

      // Keep only candidates whose required passage is present
      const validCandidates = rawCandidates.filter((c) => {
        if (c.question.passageId) {
          return Boolean(passagesMap[c.question.passageId]);
        }
        return true;
      });

      const pool: QuestionPool = {
        candidates: validCandidates,
        passages: passagesMap,
      };

      poolCache.set(subject.slug, pool);

      // Persist to DB cache
      try {
        await run(
          `INSERT INTO app_cache (key, value, updated_at) VALUES (?, ?, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
          [`pool_${subject.slug}`, JSON.stringify(pool)]
        );
      } catch (err) {
        console.warn(`[cache] could not save pool for ${subject.slug} to db:`, err);
      }

      return pool;
    } finally {
      inFlightPool.delete(subject.slug);
    }
  })();

  inFlightPool.set(subject.slug, fetchPromise);
  return fetchPromise;
}

export async function pickQuestions(
  subject: SubjectSummary,
  count: number
): Promise<{
  questions: PublicQuestion[];
  answerKey: Record<string, number>;
  optionCounts: Record<string, number>;
  passages: Record<string, PublicPassage>;
}> {
  const pool = await loadSubjectPool(subject);
  const chosen =
    count >= pool.candidates.length
      ? pool.candidates
      : shuffle(pool.candidates).slice(0, count);

  const finalQuestions: PublicQuestion[] = [];
  const answerKey: Record<string, number> = {};
  const optionCounts: Record<string, number> = {};
  const passages: Record<string, PublicPassage> = {};

  for (const { question, correct } of chosen) {
    if (question.passageId && pool.passages[question.passageId]) {
      passages[question.passageId] = pool.passages[question.passageId];
    }
    finalQuestions.push(question);
    answerKey[question.id] = correct;
    optionCounts[question.id] = question.options.length;
  }

  return {
    questions: finalQuestions,
    answerKey,
    optionCounts,
    passages,
  };
}
