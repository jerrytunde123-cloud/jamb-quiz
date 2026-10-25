# Product Spec — JAMB Readiness Engine

**Status:** Draft for review
**Product:** Success Academy · UTME Lab (working name: *Readiness*)
**Owner:** Jerry
**Last updated:** 2026-10-25

> **Prototype status (2026-10-25):** The student Today → Practice → Result
> flow, student Progress, and the read-only parent report are built on
> deterministic demo data. The readiness engine and projection are real;
> question content, auth, and share-token issuance are still sample-only.

---

## 1. The Promise

> Open the app, do today's short session, and watch your projected JAMB score
> climb. Your parent sees the same picture — without watching over your shoulder.

The product is **not** a question bank and **not** a quiz arcade. It is a
readiness engine with two surfaces: a simple daily practice loop for the
student, and a read-only progress report for the parent or guardian.

**North-star metric:** readiness delta per active student per week.
If a student's projected score does not move, the product has failed — regardless of time spent or quizzes taken.

---

## 2. Target User

| Attribute | Reality |
|---|---|
| Age | 12–17 (design for the younger end; most UTME candidates are 15–17) |
| Device | Android, often low-end, 3–4 GB RAM |
| Connectivity | Intermittent, data-expensive |
| Behaviour | WhatsApp-native; shares results and jokes via Status |
| Timeline | Weeks to months before UTME (typically April–May) |
| Emotional state | Anxious, wants certainty, easily discouraged |
| Also preparing for | WAEC (overlapping syllabus) |
| Decision-maker | Parent/guardian, often paying; wants a credible progress signal, not surveillance |

**Design consequence:** two surfaces, one engine. The student gets a
low-information loop — one question at a time, one decision per screen, no
dashboard. The parent gets the detailed report: projected score, range,
confidence, coverage, subjects, weak topics, and trend. Both read the same
projection snapshot. Mobile-first, offline-capable, low-JS, WhatsApp-shaped
distribution, and *encouraging* feedback — never shaming.

---

## 3. Product Thesis

Three pillars. Every feature must serve one of them.

| Pillar | Student's question | Product answer |
|---|---|---|
| **Know where I stand** | "Am I ready?" | Projected score + range, subject readiness, weak topics |
| **Fix my gaps fast** | "What do I do next?" | One daily session, explanations, concept drills, spaced review |
| **Stay accountable** | "Why come back tomorrow?" | Daily session, streak, weekly leagues, study pods, shareable progress |

Anything that serves none of these is out of scope.

### 3.1 Two surfaces, one engine

| Surface | Who | What it shows | What it hides |
|---|---|---|---|
| **Today → Practice → Result** | Student | Today's session, one question at a time, session score, one focus, projected estimate | Confidence intervals, coverage, timing risk, model version |
| **Progress** | Student | Score + range, subject bars, top two weak topics, parent share link | Detailed analytics, marks at stake, per-question history |
| **Parent report** (`/report/[token]`) | Parent/guardian | Projected score + range, confidence, coverage, trend, subject readiness, weakest topics, pace, model version | Raw question history, surveillance-style logs |

**Rules**

- Both surfaces read the same append-only projection snapshot. No score is
  recomputed inside a component.
- The student surface never shows a dashboard. One decision per screen.
- The parent report is read-only. In v1 it is reached through an unguessable
  share link (WhatsApp-first); there is no parent account.
- The parent sees progress, not surveillance: no per-question log, no location,
  no "last seen".
- The detailed dashboard belongs to the parent report, not the student home.

---

## 4. The Readiness Engine

### 4.1 Outputs

| Level | Output | Example |
|---|---|---|
| Topic | Mastery 0–100 | `Organic Chemistry — 34` |
| Subject | Readiness 0–100 (scaled to /100) | `Chemistry — 58/100` |
| Aggregate | Projected UTME score 0–400 + range | `Projected: 212–238 (±13)` |
| Trend | 7-day and 30-day delta | `+11 this week` |
| Confidence | Attempts, coverage, volatility | `Medium confidence · 84 attempts · 61% syllabus covered` |

**Aggregate rule:** UTME requires English + three other subjects. Show:
- `Projected (your 4)` — English + the 3 others the student selected
- `Projected (best 3)` — English + best 3 of all practiced subjects (if more than 4)

Never show a single number without its range until confidence is high. A confidently wrong score destroys trust faster than no score.

### 4.2 Ability model (Elo-lite, per topic)

Each question carries a calibrated difficulty `d ∈ [-3, +3]`.

```
p_correct = 1 / (1 + 10^(-(θ - d) / 2))
θ' = θ + K · (outcome - p_correct)
```

- `θ` = topic ability, initialised at 0
- `K` = 0.40 for the first 20 answers, then decays to 0.15 (stable ability)
- Correct answers are discounted (×0.5) when they look like guesses (see 4.6)

**Subject ability** `θ_s` = blueprint-weighted mean of its topic abilities.

**Scaled subject score:**

```
score_s = 100 · sigmoid(α · (θ_s - β))
```

with `α`, `β` calibrated so that:
- random guessing (~25%) maps near 25
- consistently correct on medium questions maps near 75
- near-perfect on hard questions maps near 95

Calibration constants are tunable and versioned (`scoring_model_version`).

**Projected aggregate** = `score_english + Σ score_best3`, capped 0–400.

### 4.3 Confidence

```
margin = z · σ_eff / sqrt(n_eff)
```

- `z = 1.64` (90% interval)
- `σ_eff` = observed variance of recent outcomes
- `n_eff` = attempts weighted by topic coverage

Display:
- `< 20 attempts/subject` → **Low** (show wide range, label "still learning you")
- `20–60` → **Medium**
- `> 60` **and** coverage ≥ 60% → **High**

### 4.4 Recency decay (forgetting curve)

Abilities decay toward the prior lazily on read:

```
θ_effective = θ_0 + (θ - θ_0) · exp(-Δt / τ)
```

- `Δt` = days since last attempt in that topic
- `τ = 21 days` (tunable)

This prevents "I scored 80% last month" from inflating readiness today.

### 4.5 Coverage (breadth)

```
coverage = Σ_topics min(attempts_t / 10, 1) · blueprint_weight_t
```

Coverage does two things:
1. Widen the confidence range when low.
2. Cap readiness: `readiness ≤ 50 + 50 · coverage` until every blueprint topic has ≥ 10 attempts.

Rationale: 90% accuracy on 3 topics is not readiness — it is luck with a narrow sample.

### 4.6 Speed and guessing

- Benchmark: **45 s/question** (UTME pace: 120 min / 180 questions).
- If median time > 1.5× benchmark → small score penalty + "timing risk" flag.
- Guessing heuristic: answer under 5 s **and** option changed frequently → discount the outcome (×0.5) and mark as low confidence.

### 4.7 Exam blueprint (UTME)

| Subject | Questions in real exam |
|---|---|
| English Language | 60 |
| Each other subject | 40 |
| **Total** | **180** |
| **Duration** | **120 minutes** |

Topic weights per subject come from the JAMB syllabus and are stored as `topic.blueprint_weight`. They drive drills, mock composition, and coverage.

### 4.8 Honesty rules

- Always show the range and confidence level.
- Provide an in-app "How is this calculated?" explainer.
- Never imply precision the data does not support.
- Log `scoring_model_version` on every projection so old scores can be explained.

---

## 5. Core Screens

### 5.1 Onboarding
- Pick subjects (English compulsory + up to 5)
- Target score (optional)
- **Adaptive diagnostic: 15 questions per chosen subject**
- Output: initial ability, first projection (wide range), weakest topics

Without the diagnostic, day-one readiness is a blind guess. This screen is mandatory for activation.

### 5.2 Student Today
- One screen, one decision: "Today's 20"
- Session size + rough time
- One primary CTA ("Let's go")
- Small score pill linking to Progress
- Streak line
- No readiness ring, no subject list, no dashboard

### 5.3 Practice
- One question at a time, adaptive difficulty
- Immediate explanation after answering (correct or not)
- Subject label only; no visible timer (pace is measured silently for the parent report)
- Progress is "Question 3 of 10", not a performance dashboard
- Session ends with score, projected estimate, and one focus
- Fast, keyboard/touch friendly

### 5.4 Drill
- 5 questions on a single concept
- Mastery updates in real time
- Ends with "Concept improved: 34 → 51"

### 5.5 Mock Exam (CBT simulator)
- Faithful UTME layout: NEXT / PREVIOUS, question palette, flag for review, timer, calculator, offline-safe
- 180 questions / 120 minutes for a full mock; subject mocks supported
- Submit → results

### 5.6 Student Progress
- Projected score + likely range
- Goal gap
- Subject readiness bars
- Top two weak topics
- "Practice now"
- "For parents: open or share the read-only report on WhatsApp"

### 5.7 Leagues, Daily Exam & Pods
- Weekly leagues by subject (Bronze / Silver / Gold), top N promote
- Daily exam: same 10 questions for everyone, midnight reset, national leaderboard (separate from the student's daily practice session)
- Study pods: 5–10 friends, private leaderboard, daily nudge

### 5.8 Review Queue
- Spaced repetition of missed questions
- SM-2-style intervals: 1d → 3d → 7d → 21d → 60d
- Progress badge with due count

### 5.9 Profile
- Subjects, target score, streak history, badges, projected trend graph
- Optional account upgrade from anonymous device

### 5.10 Parent Report (read-only, `/report/[token]`)
- Projected score + 90% range + goal gap
- Confidence, coverage, questions answered, and pace
- 7-day and 30-day trend
- Subject readiness, accuracy, question count, and month delta
- Three weakest topics with expected marks at stake
- "How to read this report" + scoring model version
- Read-only; reached through an unguessable WhatsApp-shared link. No parent account in v1.
- No raw question log, location, or "last seen" data

---

## 6. Scope

### MVP (v1) — ship in ~6 weeks

> The current prototype covers the shape of items 3–5 and 9 with sample
> content. Items 1–2, 6–8, and 10 remain the build target.

1. Anonymous-first entry (device ID) + optional account
2. Onboarding diagnostic
3. Practice with explanations
4. Topic mastery + subject readiness + projected score (v0)
5. Student Today + student Progress + read-only parent report
6. Concept drills
7. Mock exam + results analytics
8. Daily practice session + streak
9. WhatsApp-shared read-only parent report link (share card later)
10. 4 subjects at launch: English, Mathematics, Physics, Chemistry

### v1.1
- Weekly leagues + study pods
- Review queue (spaced repetition)
- AI explanation refinement + follow-up questions (premium)
- Percentile benchmarking

### v1.2
- Offline subject packs + PWA install
- Premium tier + referral unlocks
- WAEC mode (same engine, different blueprint)

### Explicitly NOT in scope
- Comments / social feed
- Public chat
- Complex admin CMS (lean content pipeline only)
- All 24 subjects at launch
- Password-based auth
- Web-only puzzles or arcade modes that do not feed readiness

---

## 7. AI Explanation Pipeline

Explanations are the trust layer. A hallucinated chemistry rule invalidates the whole score.

```
Ingest question
  → Normalise + tag topic + difficulty
  → AI draft (strict JSON schema)
  → Self-check / confidence flag
  → Human review queue
  → Publish (versioned)
  → Report button in app
```

**Draft schema**

| Field | Purpose |
|---|---|
| `why_correct` | Concept-level explanation, 1–3 sentences |
| `distractors[]` | Why each wrong option is wrong |
| `concept` | Canonical topic tag |
| `micro_rule` | One-line memory rule |
| `drill_seed` | Suggested concept for follow-up drill |

**Cost control**
- Generate **once per question version**, cache in DB
- Never call an LLM at request time except the optional premium "ask a follow-up" (rate-limited)
- Human review is mandatory before publication for launch subjects

**Quality signals**
- Report count per explanation
- Time-on-explanation vs. correctness lift (did it help?)
- Reviewer approval rate

---

## 8. Offline Strategy (v1.2)

- **Subject pack** = manifest + questions + options + explanations + compressed images
- Client storage: IndexedDB (`idb`), service worker precaches the app shell
- Offline practice writes attempts to a queue with client-generated UUIDs
- Sync on reconnect via idempotent batch POST
- Readiness recomputes server-side after sync
- Target: one subject pack < 5 MB, first session JS < 150 KB gzipped

---

## 9. Monetization

| Tier | Includes |
|---|---|
| **Free** | Diagnostic, daily exam, 3 practice sessions/day, basic readiness, 1 mock/week |
| **Premium** | Unlimited practice, full mocks, AI follow-ups, offline packs, advanced analytics, no daily caps |
| **Referral** | Invite 3 friends → 7 days Premium (WhatsApp share card) |
| **School / partner** | Class leaderboards, branded packs, bulk seats |

Pricing in NGN, set after usage data. Payment via Paystack (primary) with Flutterwave fallback.

---

## 10. Data Model (sketch)

```
users              (id, device_id?, phone?, created_at)
user_profiles      (user_id, target_score, subjects[], onboarded_at)
subjects           (id, slug, name, blueprint_total_questions)
topics             (id, subject_id, slug, name, blueprint_weight)
questions          (id, subject_id, topic_id, stem, difficulty, version, status)
question_options   (id, question_id, label, text, is_correct)
explanations       (id, question_id, question_version, why_correct, distractors_json,
                    concept, micro_rule, review_status, model_version)
attempts           (id, user_id, mode, subject_id?, started_at, finished_at)
attempt_answers    (id, attempt_id, question_id, chosen_option, is_correct,
                    seconds, changed_count, confidence_discount)
topic_mastery      (user_id, topic_id, theta, attempts, updated_at)
projections        (user_id, computed_at, subject_scores_json, projected_total,
                    margin, coverage, confidence, scoring_model_version)
mocks              (id, subject_set, question_ids[], blueprint_version)
mock_attempts      (id, user_id, mock_id, answers_json, score, finished_at)
daily_exams        (date, question_ids[], subject_ids[])
leagues            (id, subject_id, week, tier)
league_members     (league_id, user_id, points)
pods               (id, name, invite_code, owner_id)
pod_members        (pod_id, user_id)
streaks            (user_id, current, longest, freezes_left, last_active_date)
review_queue       (user_id, question_id, due_at, interval_days, ease, reps)
share_cards        (id, user_id, payload_json, image_url, created_at)
content_versions   (id, entity, entity_id, version, published_at)
reports            (id, user_id, question_id?, explanation_id?, reason, status)
```

**Design notes**
- `topic_mastery.theta` is the single source of truth for ability; subject/aggregate scores are derived.
- `projections` is append-only so trends and "score on date X" remain explainable.
- Everything versioned; never mutate a published question in place.

---

## 11. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Server components, low client JS |
| UI | Tailwind v4 + shadcn/ui | Consistent, accessible, fast |
| DB | Postgres (Neon/Supabase) | Relational model, analytics |
| ORM | Drizzle | Typed, light, migration-friendly |
| Auth | Anonymous device ID → phone OTP / magic link | Zero-friction activation |
| AI | Provider-agnostic, pre-generated + cached | Cost control, no runtime hallucination |
| Offline | Service worker + IndexedDB | Data-poor users |
| Payments | Paystack (Flutterwave fallback) | NGN-native |
| Analytics | Product events + readiness events | North-star measurement |

---

## 12. Milestones & Acceptance Criteria

| Milestone | Scope | Done when |
|---|---|---|
| **M0** | Schema, content importer, explanation pipeline, 4 subjects seeded | 500+ questions with approved explanations; schema migrated |
| **M1** | Diagnostic, practice, mastery, readiness v0 | A new user gets a projected range after the diagnostic; accuracy is difficulty-weighted with recency decay |
| **M2** | Dashboard, weak topics, drills, review queue | Dashboard shows score + range + 3 weak topics; drill raises mastery |
| **M3** | Mock exam + analytics | Full 180-Q/120-min mock completes; results show topic breakdown + pacing |
| **M4** | Daily exam, streak, league, share card | Daily exam resets at midnight; share card renders; streak persists |
| **M5** | Offline packs, PWA, premium, referral | Subject pack works offline and syncs; paywall gates premium |

---

## 13. Success Metrics

| Metric | Target (first 90 days) |
|---|---|
| Activation (diagnostic completed in first session) | ≥ 60% |
| D1 / D7 / D30 retention | 45% / 25% / 12% |
| Median weekly readiness delta (active users) | ≥ +3 points |
| Share → new user conversion | ≥ 8% |
| Free → Premium conversion | ≥ 4% |
| Explanation report rate | < 2% |

---

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AI explanations are wrong | Human review before publish; report button; versioned content |
| Projected score feels fake | Show ranges + confidence; publish methodology; never over-claim |
| Content licensing / quality | Original + licensed questions; keep provenance metadata |
| Offline complexity | Start with read-only packs; queue writes; ship after core loop works |
| Seasonal demand (exam months) | WAEC mode + "maintain readiness" off-season streaks |
| Low-end device performance | Server components, route-level code splitting, image compression, JS budget |

---

## 15. Open Decisions (to settle before M0)

1. **Brand name** — keep *Success Academy · UTME Lab* or launch *Readiness* as a distinct product?
2. **Auth** — phone OTP provider (Termii / Twilio) vs. magic link only?
3. **Payments** — Paystack vs. Flutterwave; pricing tiers in NGN.
4. **AI budget** — per-question generation cost ceiling; which model for drafts vs. review.
5. **Content source** — original writing, licensed bank, or AI-assisted human authoring? Provenance policy.
6. **Launch subjects** — confirm English, Mathematics, Physics, Chemistry as the first four.
7. **Anonymous-first vs. account-required** — confirm anonymous-first with optional upgrade.
8. **Percentile cohort** — national all-users, or per-school/partner cohort?

---

## 16. One-Line Summary

> A daily JAMB coach for the student, with a progress report the parent can trust — simple on the surface, one honest readiness engine underneath.
