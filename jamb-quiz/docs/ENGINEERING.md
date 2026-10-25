# Engineering Contract — JAMB Readiness

This document is the standing agreement for how code gets written in this project.
If a change contradicts this file, the file wins — or we update it deliberately.

**Last verified:** 2026-10-25

---

## 0. The prime directive

> **Never write framework code from memory. Read the docs bundled with the installed version, then write the code.**

This project runs versions that differ from most training data. The bundled docs are the source of truth.

---

## 1. Environment (verify at the start of any work session)

| Package | Version at last check | Doc source |
|---|---|---|
| Next.js | 16.4.3 | `node_modules/next/dist/docs/` |
| React | 19.3.1 | — |
| Tailwind CSS | 4.3.3 | CSS-first, no `tailwind.config.*` |
| shadcn CLI | 4.22.1 | `./node_modules/.bin/shadcn` |
| AI SDK (`ai`) | 7.0.153 | `node_modules/ai/docs/` |
| Vitest | 5.0.5 | `npm test` |

Re-verify with:

```bash
for p in next react tailwindcss shadcn ai; do
  printf "%-12s " "$p"; grep -m1 '"version"' "node_modules/$p/package.json"
done
npm view ai version            # compare against latest
```

If Next.js, React, or the AI SDK is a **major** version behind latest, stop and raise it before building.

---

## 2. Next.js 16 rules

Read the relevant page in `node_modules/next/dist/docs/01-app/` **before** writing the feature.

Non-negotiables confirmed in the bundled docs:

- **Route params are async.** `const { slug } = await params` in pages, layouts, and route handlers.
  - `docs/01-app/01-getting-started/03-layouts-and-pages.md`
- **Caching is Cache Components.** The config already enables `cacheComponents: true` and `partialPrefetching: true`. Read `docs/01-app/01-getting-started/08-caching.md` before adding any `"use cache"`, `cacheLife`, or `cacheTag`.
- **Server Components by default.** Add `"use client"` only at the smallest interactive leaf. Never at page or layout level unless the whole tree genuinely needs it.
- **No `getServerSideProps` / `getStaticProps`.** App Router only.
- **Metadata via the `Metadata` export**, not `<Head>`.
- **`next/link` for internal navigation**, `<a>` only for external links.
- **Typed routes**: the layout uses `LayoutProps<"/">`. Use the generated `PageProps<...>` / `LayoutProps<...>` helpers rather than hand-typing params.
- **Images**: `next/image` with explicit dimensions.

If the bundled docs do not cover what you need, search `https://nextjs.org/docs` (append `.md` for markdown) or say you cannot verify it. Do not guess.

---

## 3. Tailwind CSS v4 rules

- There is **no `tailwind.config.ts`**. Theme tokens live in `app/globals.css` under `@theme inline`.
- Use the existing semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, …). Do **not** hard-code hex colors.
- Dark mode is class-based via `@custom-variant dark`.
- Prefer `flex`/`grid` + `gap-*` over margins. Use `size-*` for square elements.

---

## 4. shadcn components

**Never hand-write a primitive the CLI can generate.**

Use the local, version-matched binary — not `npx shadcn@latest`:

```bash
./node_modules/.bin/shadcn info                 # confirm framework/style/config
./node_modules/.bin/shadcn docs <component>     # read usage + API
./node_modules/.bin/shadcn add <component> --dry-run
./node_modules/.bin/shadcn add <component>
```

Rules:

1. `components.json` is the source of truth (`style: radix-vega`, `base: radix`, `iconLibrary: lucide`).
2. `cn` comes from `@/lib/utils`, which re-exports from the `cn` package.
3. Primitives import from the unified `radix-ui` package (e.g. `Slot` from `"radix-ui"`), not `@radix-ui/react-*`.
4. After adding a component, **read the generated file** to confirm its current props/API before using it. Do not assume the API from an older shadcn version.
5. Do not run `shadcn init` again — the project is already initialised.
6. If a generated primitive must be customised, keep the diff minimal and note why in the commit or a comment.

---

## 5. AI SDK rules

- Read `node_modules/ai/docs/` for the installed version. Never write AI SDK code from memory.
- **Never use model IDs from memory.** Fetch the live list:
  ```bash
  curl -s https://ai-gateway.vercel.sh/v1/models | jq -r '.data[].id'
  ```
- Structured output is `generateText({ output: Output.object({ schema }) })` in v7 — verify against `node_modules/ai/docs/03-ai-sdk-core/10-generating-structured-data.mdx`.
- Agents use `ToolLoopAgent`, not hand-rolled loops.
- **Generation is offline/batch and cached.** No per-student LLM calls at request time except the explicitly gated premium tutor.
- Every generated artifact records `model_version` and `prompt_version`.
- Treat question text as untrusted input (prompt injection).

---

## 6. Verification gates (definition of done)

A change is not done until all four pass **in `jamb-quiz/`**:

```bash
npm test            # vitest
npx tsc --noEmit
npm run lint
npm run build
```

Domain logic (scoring, scheduling, content transforms) must ship with tests.
UI-only changes still need the typecheck, lint, and build gates.

Additional rules:

- Fix warnings introduced by your change. Pre-existing warnings must be named, not silently ignored.
- Never commit with a failing build.
- For UI work, also confirm the route renders (`npm run dev`, fetch the page).

---

## 7. Git rules

- **Do not `git push` or use `gh` unless the owner explicitly asks in that turn.**
- Commit messages: `type(scope): summary` (`feat`, `fix`, `refactor`, `chore`, `docs`, `test`).
- One logical change per commit.
- Never commit `node_modules`, `.next`, `.env*`, or `*.db`.
- Do not rewrite or force-push shared history.

## 7.1 Dev workflow

- **One server at a time.** Stop `next start` before `npm run dev`. If port
  3000 is already taken, dev either moves to another port or exits; you can end
  up testing a stale production build without noticing.
- **Use `http://localhost:3000`.** When testing from a phone, add the machine's
  LAN hostname to `allowedDevOrigins` in `next.config.ts`; otherwise Next
  blocks HMR and changes appear not to apply.
- **Test the gate in a fresh window.** The experimental gate persisted a
  30-day unlock in `localStorage`; once unlocked, subject clicks skip the
  modal. The parent port gates every attempt, so this state disappears with
  the rebuild.

---

## 8. Code organisation

```
app/                 routes, layouts, route handlers
components/
  ui/                shadcn primitives (generated)
  <feature>/         feature components
lib/                 pure helpers, data access, schemas
hooks/               client hooks
docs/                product + engineering docs
```

Current surface routes:

```
app/page.tsx                  readiness Today (set aside, still reachable)
app/practice/page.tsx         one-question-at-a-time readiness session
app/progress/page.tsx         readiness progress
app/report/[token]/page.tsx   read-only parent report
app/quiz/page.tsx             subject picker + WhatsApp gate
app/quiz/[subject]/page.tsx   gate handoff → quiz
app/api/quiz/[subject]/       create a graded session with live questions
app/api/quiz/submit/          grade a session and record the attempt
app/api/leaderboard/[subject] top attempts for a subject
app/api/subjects/             question-bank subject catalogue
app/api/image/                cached proxy for question figures
```

- Business logic in `lib/`, not inside components.
- Pure functions first; side effects isolated.
- TypeScript strict; no `any` without a comment explaining why.
- Named exports for shared modules; default export only where the framework requires it.

## 8.1 WhatsApp gate

The gate is an honour gate, not access control. Do not add server
verification, bot codes, or a Cloud API dependency for it.

**The parent app is the source of truth.** The current `/quiz` gate is an
experiment and is being replaced. Do not add more behaviour to it; port the
parent flow instead (`docs/PARENT-PORT.md`).

- **Both channels are required.** The parent gate is not satisfied until both
  the main channel and `JAMB UTME` are opened. There is no optional channel
  inside the gate.
- **Gate every attempt.** There is no 30-day or app-wide unlock. A subject
  click opens the gate; the parent only keeps a short per-attempt handoff key
  so the quiz can auto-start after the modal closes.
- **Nickname is a gate step.** After both channels, ask for the leaderboard
  name (max 20, prefilled from the last value), then start the quiz.
- **Copy stays short.** One title, one instruction, the two channel buttons,
  the continue button, and the share block. Do not grow it into paragraphs.
- **Mobile handoff:** on coarse-pointer devices the channel link is
  `whatsapp://channel/<code>` (the same scheme WhatsApp's own invite page
  uses); desktop and the server-rendered link stay on
  `https://whatsapp.com/channel/<code>`. This keeps hydration clean and gives
  desktop a working page.
- **Fallback:** mobile also shows the https link. If an in-app browser blocks
  the custom scheme, the user can still open the channel.
- **Honesty:** opening the link is recorded; the UI never claims to verify a
  follow.

## 8.2 Quiz loop

The quiz loop is a port of the legacy implementation, not a reimplementation
of the question bank.

- **Server owns grading.** `app/api/quiz/[subject]` fetches questions and writes
  the answer key to `sessions`. The browser only receives `PublicQuestion`
  rows (no answer). `app/api/quiz/submit` grades against that stored key.
- **Shared Turso schema.** The nested app points at the same `sessions`,
  `attempts`, `likes`, `comments`, and `app_cache` tables as the legacy app.
  Do not create a second schema or a second database for the quiz.
- **Server-only modules.** `lib/quiz/{turso,utmelab,service,subject-meta}.ts`
  import Node APIs and must never be imported from a client component. Client
  components import types from `lib/quiz/types.ts` and the static catalogue
  from `lib/quiz/subjects.ts` only.
- **Cache Components.** Quiz route handlers are dynamic by default. Do not add
  `export const dynamic = "force-dynamic"`; with `cacheComponents` enabled the
  segment config is removed and request-time data already runs per request.
- **Timer.** The countdown uses an absolute deadline and auto-submits with the
  latest answers held in a ref, so a backgrounded tab cannot strand a session.
- **Rich text.** `components/quiz/rich-text.tsx` renders API inline marks and
  KaTeX. Question figures go through `/api/image`, never directly to the
  third-party host.

---

## 9. Domain layer

`lib/readiness/` is the scoring engine. It is the source of truth for every
number the product shows.

Rules:

- **Pure TypeScript.** No React, no Next.js, no database imports. It must be
  runnable in a test file and a batch script.
- **Versioned.** `SCORING_MODEL_VERSION` changes whenever a constant or formula
  changes. Projections record it.
- **Tested.** Every rule in `docs/PRODUCT.md` §4 has a test in
  `lib/readiness/readiness.test.ts`. Add a failing test before changing a
  formula.
- **Derived, never stored twice.** Topic mastery is the input; subject
  readiness, coverage, margins, and the aggregate score are computed from it.

`lib/demo/` is throwaway sample data used by the student and parent surfaces.
It is deterministic and is the only place allowed to invent attempts.

## 10. Product constraints that affect code

From `docs/PRODUCT.md`:

- **Offline-first** for practice packs: no runtime dependency on the network for already-downloaded content.
- **Low-end Android**: minimise client JS; server-render by default.
- **Readiness math is deterministic** and versioned (`scoring_model_version`). Never let an LLM compute a score.
- **AI explanations are pre-generated, human-reviewed, and cached** by question + content version.
- **One projection, two surfaces.** The student Today/Practice/Result/Progress screens and the parent report must read the same projection snapshot. Do not recompute scores in components; call the engine once per surface (or pass the projection down).
- **The parent report is read-only.** In v1 it is reached through an unguessable share token and has no account, no write actions, and no per-question surveillance log.
- **The student surface is low-information.** One decision per screen; no dashboard, no readiness ring, no dense analytics.

---

## 11. When unsure

1. Check the bundled docs.
2. Check the installed source.
3. Search the official docs online.
4. If still unresolved — **say so and ask**. A wrong guess is worse than a question.
