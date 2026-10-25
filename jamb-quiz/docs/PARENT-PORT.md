# Parent App Port — Source of Truth

The legacy root app (`../src`) is the product source of truth. This app is a
clean rebuild of it: same content, flows, and features; new code, shadcn
components, and no legacy CSS.

Do not "simplify" a client decision. If something here looks like a product
choice, it is one.

## 1. Non-negotiables (client choices)

- **Two required WhatsApp channels.** The gate is not satisfied until both are
  opened. There is no optional channel inside the gate.
- **Gate every attempt.** The gate is not stored for 30 days. A subject click
  opens the gate, then nickname, then the quiz.
- **Nickname inside the gate.** The parent asks for a leaderboard name before
  starting the quiz. Max 20 characters, prefilled from the last value.
- **15 questions / 5 minutes / randomised.** Grading is server-side; the
  browser never receives the answer key.
- **Brand:** SUCCESS ACADEMY · UTME LAB — JAMB/WAEC Practice.
- **Share and challenge are optional**, never a gate requirement.

## 2. Route surface

| Route | Purpose |
| --- | --- |
| `/` | Header, hero, streak, recents, subject grid, assistance panel, footer |
| `/quiz/[subject]` | Gate handoff → quiz → results → share |
| `/leaderboard/[subject]` | Full leaderboard + comment wall |
| `/s/[slug]` | Viral share entry; redirects to `/?subject=…&challenger=…&score=…` |
| `/admin` | Key-protected stats, bank sync, share links, catalog |
| `/api/subjects` | Question-bank catalogue |
| `/api/quiz/[subject]` | Start a session (questions without answers) |
| `/api/quiz/submit` | Grade and record an attempt |
| `/api/leaderboard/[subject]` | Top attempts |
| `/api/stats/[subject]` | Attempts + likes |
| `/api/like/[subject]` | Increment the like counter |
| `/api/comments` | Post a comment |
| `/api/comments/[subject]` | List comments |
| `/api/image` | Cached question-figure proxy |

## 3. Home

### Header

- Logo: `/logo.png`
- Brand: `SUCCESS ACADEMY`
- Sub-brand: `UTME LAB · JAMB/WAEC Practice`
- Links: `Main Channel` (WhatsApp), `Telegram`, `Contact`

### Hero

- `PRACTICE 1000+ JAMB & WAEC QUESTIONS`
- `15 questions · 5 minutes · Randomised every attempt`
- Streak pill when active: `🔥 {n}-Day Practice Streak!`

### Challenge banner

When `/?challenger=…&score=…&subject=…` is present:

- `{challenger} challenged you to beat {score}/15 in {subject}!`
- `Can you step up and take the #1 spot? Click below to start!`

### Recents

- `Recently Practiced` + `Clear`
- Up to 4 subject cards, same card component as the grid.

### Subject grid

- Heading: `Pick a Subject` (or `All Subjects` when recents are present).
- Card: icon, name, `{count} questions`, best-score badge, copy-share-link button.
- Clicking a card opens the gate; it never navigates straight to the quiz.

### Assistance panel

- Eyebrow: `SUCCESS ACADEMY · UTME LAB`
- Title: `Need the full exam guide & preparation help?`
- Copy: `Go beyond practice quizzes — get complete JAMB/Past-question prep, study materials, CBT simulation and 1-on-1 assistance from our team.`
- Chips: Study materials, Full CBT simulator, 1-on-1 assistance, Exam guide.
- Buttons: `Visit utmelab.com`, `Chat on WhatsApp`, `Chat on Telegram`,
  `JAMB Practice (Vercel)`.

### Footer

- `© SUCCESS ACADEMY · UTME LAB`
- `Contact · utmelab.com`

## 4. Gate

### Step 1 — channels

- WhatsApp icon
- `Join Both Channels to Unlock`
- Challenge banner, when present.
- Otherwise: `You must join **both** WhatsApp channels before starting the **{subject}** quiz.`
- Channel buttons: `Join Main Channel`, `JAMB UTME`.
- Each button opens WhatsApp, shows a short pending countdown, and becomes done
  when the user returns or the countdown ends.
- Continue disabled until both are done: `Continue to Quiz`.
- Share block: `Share with Friends on WhatsApp`.
- `Optional channel: 2027 JAMBITES` (outside the requirement).

### Step 2 — nickname

- `Enter Your Nickname`
- `This will appear on the {subject} leaderboard.`
- Input: max 20, placeholder `e.g. Scholar01`, prefilled from storage.
- Button: `Start Quiz →`.

## 5. Quiz

### Start

- Subject name.
- `15 questions · 5 minutes · randomised every attempt. Your answers are graded on the server.`
- Sound toggle, streak, `Start quiz`.
- Anonymous note when no nickname is set.

### In progress

- `Question {n} / 15`, timer `m:ss`.
- Progress bar and question palette.
- Passage above the stem when the question has one.
- Options `A–F`, selected state, keyboard shortcuts.
- `← Previous`, `Next →`, `Submit ({answered}/15)` on the last question.
- Auto-submit at 0, using the latest answers.

### Results

- Hype card: badge, emoji, tagline, quote, colour by score tier.
- Animated score, percentage, subject, time.
- Badges: speed demon, streak, new personal best.
- Share: WhatsApp and Telegram, with a `/s/{slug}?challenger=…&score=…` link.
- Tabs: Review Answers, Leaderboard, Comments.
- Review: correct option, chosen option, passage, rich text/math.
- `Try another set`, `Back to subjects`.

## 6. Leaderboard and comments

- Subject leaderboard: rank, nickname, score, time, date.
- Empty state: `No attempts recorded yet. Be the first!`
- Comment wall: name, message (max 400), post, list newest first.
- No account required.

## 7. Admin

- Secret key from `ADMIN_KEY`, stored in an httpOnly cookie for 7 days.
- Stats: total attempts, live subjects, bank version, likes, comments, cached pools.
- Most practiced subjects: subject, attempts, average score.
- Bank sync action.
- Share-link generator with copy/WhatsApp/Telegram per subject.
- Subject catalog.

## 8. Shared behaviour

- **Nickname** persists in localStorage and is used on the leaderboard.
- **Best score** per subject persists and shows on the home card.
- **Recents** persist, max 4, with clear.
- **Streak** persists by local calendar day.
- **Sounds** are synthesised, with a toggle.
- **Confetti** fires on a strong result or a new best.
- **Hype** tiers and quotes are content, not logic to redesign.
- **Math and figures** render through KaTeX and the image proxy.

## 9. Data and API

Reuse the existing clean port in `lib/quiz/`:

- `sessions`, `attempts`, `likes`, `comments`, `app_cache`.
- The answer key stays in `sessions`; submit grades from it.
- The question API is the UTME Lab API, verified questions only.
- Subjects come from `/public/exams`, not a hardcoded list.
- Passages are fetched once and shared by their questions.
- Images are proxied and cached.

## 10. What happens to the current experiment

- **Keep:** `lib/quiz/` (question bank, sessions, grading, cache),
  `components/quiz/rich-text.tsx`, and the API routes already ported.
- **Rebuild:** the gate (two required channels + nickname), the home page, the
  quiz start/flow, and the visual layer.
- **Set aside:** the readiness engine, demo data, practice/progress/report
  routes, and the 30-day gate store. They stay in the tree until the parent
  port replaces the home, then they are archived, not deleted blindly.
- **Do not ship:** the one-channel gate, the optional second channel, the
  30-day unlock, or the separate quiz intro screen.

## 11. Build order

1. Home shell and subject grid (real API subjects).
2. Gate: both channels → nickname → quiz handoff.
3. Quiz flow: start, timer, palette, submit, results.
4. Results tabs: review, leaderboard, comments.
5. Share/challenge route and copy.
6. Admin.
7. Remove the readiness routes from the main surface.
8. Full pass: mobile, real device, lint, typecheck, tests, build.
