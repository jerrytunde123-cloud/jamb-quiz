# JAMB Quiz · UTME Lab

A modern rebuild of the UTME Lab quiz app: **Next.js 16 (App Router) + TypeScript**,
**Turso** (libSQL) for app data, and the
**UTME Lab question API** for the question bank.

Learners unlock the app by joining the WhatsApp channels, pick a nickname, choose a
subject, and answer **15 questions in 5 minutes**. Scoring happens **on the server** —
the answer key is never sent to the browser.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in the values
npm run db:push                # create the app tables
npm run dev
```

The app is at <http://localhost:3000>.

### Upgrading an existing database

Databases created before the question bank moved to the API still have a
`questions` table and the old `sessions` shape. Run the migration once:

```bash
npm run db:migrate
npm run db:push
```

### Running locally without Turso

Set a `file:` URL and the app uses a local libSQL database instead of Turso:

```bash
# .env.local
TURSO_DATABASE_URL=file:./dev.db
```

Then create the schema:

```bash
npm run db:push
```

There is no local question seed: quiz questions come from the API, so
`UTMELAB_API_KEY` must be set even in development.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:flow` | End-to-end check of the quiz + grading flow (hits the live question API) |
| `npm run db:push` | Apply `db/schema.sql` to Turso |
| `npm run db:migrate` | Apply pending `db/migrations/*.sql` once each |

---

## Architecture

```
src/
  app/
    page.tsx                    # home: channel gate → nickname → subject grid
    quiz/[subject]/page.tsx     # a quiz for one subject
    leaderboard/[subject]/      # leaderboard + comment wall
    sign-in/                    # Better Auth email/password
    admin/                      # admin overview
    api/
      auth/[...all]/            # Better Auth handler
      subjects/                 # GET  list of subjects (from the API)
      quiz/[subject]/           # GET  start a quiz (questions, no answers)
      quiz/submit/              # POST grade an attempt
      leaderboard/[subject]/    # GET  top attempts
      stats/[subject]/          # GET  attempts + likes
      like/[subject]/           # POST increment the like counter
      comments/                 # POST add a comment
      comments/[subject]/       # GET  list comments
  components/                   # client components (Home, Quiz, Comments, RichText)
  lib/
    turso.ts                    # database access (Turso Cloud or local libSQL)
    quiz.ts                     # quiz domain logic — sessions, grading, leaderboard
    utmelab.ts                  # UTME Lab question API client
    auth.ts                     # Admin key guard
    types.ts                    # shared domain types
    use-local-storage.ts        # React hook for localStorage without effects
db/
  schema.sql                    # app tables
  migrations/                   # one-off SQL for existing databases
scripts/                        # CLI helpers (schema push, migration, flow test)
```

### The question bank lives in the API

There is no local question table and no question JSON file. A quiz start calls the
UTME Lab API once for the subject's verified questions **with their answer key**,
keeps the key server-side in the `sessions` row, and sends only the questions to
the browser. Nothing about the bank is mirrored, so a bank change is picked up on
the next attempt.

The subject grid and the leaderboard titles come from the API's keyless
`/public/exams` catalogue, which also carries each subject's verified count.
The catalogue is memoised for five minutes per server instance.

### Grading is server-side

`POST /api/quiz/submit` receives a `quizId` and a map of answers. The server:

1. Loads the session from the `sessions` table. Unknown or already-used sessions are rejected.
2. Takes the question ids **and the answer key from the session**, never from the request —
   so a learner cannot submit answers for questions they were never served.
3. Scores only option indices inside the question's own option count. The bank
   serves two to six options per row, so the range is not fixed — the session
   records each question's count, and an index the question does not have is
   not an answer.
4. Records the attempt and marks the session used, in one atomic transaction.

The browser is served questions without their answers, and receives the answer
key back only in the submit response (for the review screen).

### Database

| Table | Purpose |
| --- | --- |
| `sessions` | In-flight quizzes: subject, the served answer key + option counts, and a `used` flag |
| `attempts` | Graded attempts (subject slug, score, total, time, nickname) |
| `likes` | Per-subject like counter |
| `comments` | Comment wall |
| `app_cache` | Persistent LibSQL cache for subjects & questions |

### UTME Lab question API

Base URL: `https://api.utmelab.com/api/v1` (override with `UTMELAB_API_URL`).
Every question call is authenticated with the server-only `UTMELAB_API_KEY`
sent as `x-api-key`.

| Call | Used for |
| --- | --- |
| `GET /public/exams` | Subject grid, counts, names (no key) |
| `GET /questions?exam=JAMB&subject={slug}&verified=true&include_explanation=true&page=1&per_page=200` | Quiz questions + answer key |
| `GET /passages/{id}` | The reading stimulus a comprehension/cloze question is read against |

Notes:

* Only **verified** rows are served, so a learner never sees an unchecked answer.
* Questions with a `passage_id` are served **with their stimulus**: the
  passage is fetched separately and shown above the stem, both in the quiz and
  in the review screen. A question whose passage cannot be fetched is dropped
  rather than served as a stem the learner cannot read against.
* Passages are cached in memory (10 minutes per instance) and concurrent
  requests for the same id share one call, so a passage that serves five to
  nine questions costs one request.
* Figures arrive as zero-length `image` marks with an absolute https `url` and a
  `position` (`above`/`below`). They render as block figures around their stem
  or option, with `alt` preserved. A malformed image mark drops the question
  rather than showing a stem whose diagram is missing.
* Formulas use the bank's `\( … \)` delimiters (also `\[ … \]` and `$$ … $$`);
  stems and options render through KaTeX, with MathML for assistive tech. A
  lone `$` is left as text, so a price is never mistaken for math.
* `per_page` caps at 200. JAMB subjects are under that today, so a quiz costs one
  question call; if a subject grows past a page, a second random page widens the
  sample.
* The key is limited to 60 requests/minute. When the API answers `429`, starting a
  quiz shows a "busy, try again" message; subjects still render because that
  catalogue call is keyless.
* Requests resolve IPv4 first, falling back to IPv6. Node's default
  happy-eyeballs selection can time out on NAT64 networks that advertise IPv6
  addresses with no working route (`fetch failed`); the API serves fine over
  IPv4.
* The API is in MVP: response shapes can still change. All parsing lives in
  `src/lib/utmelab.ts`.

---

## Admin access

The admin dashboard at `/admin` is protected by `ADMIN_KEY` from the environment.

* `ADMIN_KEY` — Secret password string to view operations and statistics dashboard.
* The admin dashboard shows: total attempts recorded, live subjects, total likes, comments, cached question pools in database, and a table of the most practiced subjects with average scores.

---

## Deployment notes

* Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to real Turso Cloud credentials.
* Run `npm run db:migrate` once when upgrading an existing database, then
  `npm run db:push` and `npm run db:auth`.
* Set `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `JWT_SECRET` and `UTMELAB_API_KEY`.
* The question API key is server-only. Do not prefix it with `NEXT_PUBLIC_`.
