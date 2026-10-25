"use client"

import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { GateResetButton } from "@/components/gate/gate-reset-button"
import { RichText } from "@/components/quiz/rich-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type {
  PublicPassage,
  PublicQuestion,
  QuizPayload,
  SubmitResult,
} from "@/lib/quiz/types"

const LETTERS = ["A", "B", "C", "D", "E", "F"]
const NICKNAME_KEY = "jamb-quiz:nickname:v1"

type Phase = "intro" | "loading" | "quiz" | "submitting" | "done" | "error"
type ResultTab = "review" | "leaderboard"

type QuizRunnerProps = {
  subject: { slug: string; name: string }
}

function formatClock(seconds: number) {
  const safe = Math.max(0, seconds)
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatTaken(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${String(s).padStart(2, "0")}s`
}

export function QuizRunner({ subject }: QuizRunnerProps) {
  const [phase, setPhase] = useState<Phase>("intro")
  const [questions, setQuestions] = useState<PublicQuestion[]>([])
  const [passages, setPassages] = useState<Record<string, PublicPassage>>({})
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState(300)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [resultTab, setResultTab] = useState<ResultTab>("review")
  const [error, setError] = useState<string | null>(null)
  const [nickname, setNickname] = useState("")

  const answersRef = useRef<Record<string, number>>({})
  const payloadRef = useRef<QuizPayload | null>(null)
  const deadlineRef = useRef(0)
  const startedAtRef = useRef(0)
  const submittedRef = useRef(false)

  const start = useCallback(async () => {
    setPhase("loading")
    setError(null)
    setResult(null)
    setResultTab("review")
    setAnswers({})
    answersRef.current = {}
    setIndex(0)
    submittedRef.current = false
    payloadRef.current = null

    try {
      const res = await fetch(`/api/quiz/${encodeURIComponent(subject.slug)}`, {
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not start the quiz.")
      }

      payloadRef.current = data as QuizPayload
      setQuestions((data as QuizPayload).questions ?? [])
      setPassages((data as QuizPayload).passages ?? {})

      const duration = (data as QuizPayload).duration ?? 300
      startedAtRef.current = Date.now()
      deadlineRef.current = Date.now() + duration * 1000
      setRemaining(duration)
      setPhase("quiz")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the quiz.")
      setPhase("error")
    }
  }, [subject.slug])

  const submit = useCallback(async () => {
    const payload = payloadRef.current
    if (!payload || submittedRef.current) return

    submittedRef.current = true
    setPhase("submitting")

    try {
      let name = ""
      try {
        name = (window.localStorage.getItem(NICKNAME_KEY) ?? "").trim()
      } catch {
        /* ignore */
      }

      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quizId: payload.quizId,
          answers: answersRef.current,
          nickname: name || "Anonymous",
          timeTaken: Math.round((Date.now() - startedAtRef.current) / 1000),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not submit your answers.")
      }

      setResult(data as SubmitResult)
      setPhase("done")
    } catch (err) {
      submittedRef.current = false
      setError(
        err instanceof Error ? err.message : "Could not submit your answers."
      )
      setPhase("error")
    }
  }, [])

  // Countdown. The deadline is absolute, so a backgrounded tab does not drift.
  useEffect(() => {
    if (phase !== "quiz") return

    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000)
      )
      setRemaining(left)
      if (left <= 0) void submit()
    }

    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [phase, submit])

  const current = questions[index]
  const answeredCount = Object.keys(answers).length
  const progress = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0
  const passage = current?.passageId ? passages[current.passageId] : undefined

  function choose(optionIndex: number) {
    if (!current) return
    setAnswers((prev) => {
      const next = { ...prev, [current.id]: optionIndex }
      answersRef.current = next
      return next
    })
  }

  function goTo(nextIndex: number) {
    setIndex(Math.max(0, Math.min(questions.length - 1, nextIndex)))
  }

  useEffect(() => {
    if (phase !== "quiz" || !current) return

    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return

      const number = Number.parseInt(event.key, 10)
      if (number >= 1 && number <= current.options.length) {
        event.preventDefault()
        choose(number - 1)
        return
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        goTo(index - 1)
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        goTo(index + 1)
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // `current` is the option source for the number keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current, index])

  if (phase === "loading") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Loading {subject.name} questions…
        </p>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <Card className="mx-auto mt-10 w-full max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={() => void start()}>
              <RotateCcw />
              Try again
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/quiz">Back to subjects</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (phase === "submitting") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Grading your answers…
        </p>
      </div>
    )
  }

  if (phase === "done" && result) {
    return (
      <ResultView
        subject={subject}
        questions={questions}
        passages={passages}
        result={result}
        tab={resultTab}
        onTabChange={setResultTab}
        onRetry={() => void start()}
      />
    )
  }

  if (phase === "quiz" && current) {
    const low = remaining <= 60
    const critical = remaining <= 10

    return (
      <div className="flex flex-1 flex-col gap-4 pb-6">
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{subject.name}</p>
            <p className="text-xs text-muted-foreground">
              Question {index + 1} of {questions.length}
            </p>
          </div>

          <Badge
            variant={critical ? "destructive" : low ? "outline" : "secondary"}
            className="h-7 gap-1.5 px-2.5 text-xs tabular-nums"
            aria-live="polite"
          >
            <Clock3 className="size-3.5" />
            {formatClock(remaining)}
          </Badge>
        </div>

        <Progress value={progress} aria-label="Questions answered" />

        <div className="grid grid-cols-8 gap-1.5">
          {questions.map((question, questionIndex) => {
            const isCurrent = questionIndex === index
            const isAnswered = answers[question.id] !== undefined

            return (
              <button
                key={question.id}
                type="button"
                aria-label={`Go to question ${questionIndex + 1}${
                  isAnswered ? ", answered" : ""
                }`}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => goTo(questionIndex)}
                className={[
                  "h-8 rounded-md border text-xs font-medium tabular-nums transition-colors",
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : isAnswered
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                ].join(" ")}
              >
                {questionIndex + 1}
              </button>
            )
          })}
        </div>

        <Card className="flex-1">
          <CardContent className="gap-4 pt-4">
            {passage ? <Passage passage={passage} /> : null}

            <div className="space-y-1">
              <h2 className="text-lg leading-snug font-medium">
                <RichText text={current.question} marks={current.inline} />
              </h2>
              {current.year > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {current.exam} {current.year}
                  {current.section ? ` · ${current.section}` : ""}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              {current.options.map((option, optionIndex) => {
                const selected = answers[current.id] === optionIndex

                return (
                  <button
                    key={optionIndex}
                    type="button"
                    onClick={() => choose(optionIndex)}
                    aria-pressed={selected}
                    className={[
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:bg-muted/60",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {LETTERS[optionIndex]}
                    </span>
                    <span className="pt-0.5 leading-relaxed">
                      <RichText
                        text={option}
                        marks={current.optionInline[optionIndex]}
                      />
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
          >
            <ArrowLeft />
            Previous
          </Button>

          {index < questions.length - 1 ? (
            <Button
              size="lg"
              className="flex-1"
              onClick={() => goTo(index + 1)}
            >
              Next
              <ArrowRight />
            </Button>
          ) : (
            <Button
              size="lg"
              className="flex-1"
              onClick={() => void submit()}
              disabled={answeredCount === 0}
            >
              Submit ({answeredCount}/{questions.length})
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-10">
      <div className="space-y-3">
        <Badge variant="secondary">Ready</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">
          {subject.name}
        </h1>
        <p className="text-muted-foreground">
          15 questions · 5 minutes. Answers are graded on the server, so your
          score is final once you submit.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="quiz-nickname"
          className="text-sm font-medium"
        >
          Leaderboard name <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="quiz-nickname"
          value={nickname}
          maxLength={40}
          onChange={(event) => {
            const value = event.target.value
            setNickname(value)
            try {
              window.localStorage.setItem(NICKNAME_KEY, value)
            } catch {
              /* ignore */
            }
          }}
          placeholder="Anonymous"
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        <p className="text-xs text-muted-foreground">
          Leave it blank and you&apos;ll appear as Anonymous.
        </p>
      </div>

      <Button size="lg" className="h-12 w-full rounded-xl" onClick={() => void start()}>
        Start quiz
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/quiz" className="underline-offset-4 hover:underline">
          Choose another subject
        </Link>
      </p>

      <div className="pt-4">
        <GateResetButton />
      </div>
    </div>
  )
}

function Passage({ passage }: { passage: PublicPassage }) {
  const heading = [passage.kind, passage.title].filter(Boolean).join(" — ")

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      {heading ? (
        <p className="mb-1 text-xs font-semibold tracking-wide uppercase">
          {heading}
        </p>
      ) : null}
      {passage.author ? (
        <p className="mb-1 text-xs text-muted-foreground">{passage.author}</p>
      ) : null}
      <div className="max-h-64 overflow-y-auto text-sm leading-relaxed">
        <RichText text={passage.text} marks={passage.inline} />
      </div>
    </div>
  )
}

type ResultViewProps = {
  subject: { slug: string; name: string }
  questions: PublicQuestion[]
  passages: Record<string, PublicPassage>
  result: SubmitResult
  tab: ResultTab
  onTabChange: (tab: ResultTab) => void
  onRetry: () => void
}

function ResultView({
  subject,
  questions,
  passages,
  result,
  tab,
  onTabChange,
  onRetry,
}: ResultViewProps) {
  const percentage = result.total
    ? Math.round((result.score / result.total) * 100)
    : 0

  const message = useMemo(() => {
    if (percentage >= 80) return "Excellent. Keep this pace."
    if (percentage >= 60) return "Solid. Review the misses and go again."
    if (percentage >= 40) return "You're building. Target the weak topics."
    return "Start with the review below, then retry."
  }, [percentage])

  return (
    <div className="flex flex-1 flex-col gap-5 pb-8">
      <Card className="overflow-hidden">
        <div className="h-1.5 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <CardContent className="items-center gap-1 pt-6 text-center">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {subject.name}
          </p>
          <p className="text-5xl font-semibold tracking-tight tabular-nums">
            {result.score}
            <span className="text-2xl text-muted-foreground">
              /{result.total}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {percentage}% · {formatTaken(result.timeTaken)}
          </p>
          <p className="mt-2 text-sm">{message}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => onTabChange("review")}
          className={[
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            tab === "review"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Review answers
        </button>
        <button
          type="button"
          onClick={() => onTabChange("leaderboard")}
          className={[
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            tab === "leaderboard"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Leaderboard
        </button>
      </div>

      {tab === "review" ? (
        <div className="flex flex-col gap-3">
          {questions.map((question, questionIndex) => {
            const correct = result.answers[question.id]
            const picked = result.chosen[question.id]
            const isRight = picked === correct
            const passage = question.passageId
              ? passages[question.passageId]
              : undefined

            return (
              <Card key={question.id}>
                <CardContent className="gap-3 pt-4">
                  <div className="flex items-start gap-2">
                    {isRight ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <div className="min-w-0 space-y-1">
                      {passage ? <Passage passage={passage} /> : null}
                      <p className="text-sm leading-snug font-medium">
                        {questionIndex + 1}.{" "}
                        <RichText
                          text={question.question}
                          marks={question.inline}
                        />
                      </p>
                    </div>
                  </div>

                  <ul className="flex flex-col gap-1.5 pl-6">
                    {question.options.map((option, optionIndex) => {
                      const isCorrectOption = optionIndex === correct
                      const isPicked = optionIndex === picked

                      return (
                        <li
                          key={optionIndex}
                          className={[
                            "flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm",
                            isCorrectOption
                              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                              : isPicked
                                ? "bg-destructive/10 text-destructive"
                                : "text-muted-foreground",
                          ].join(" ")}
                        >
                          <span className="font-semibold">
                            {LETTERS[optionIndex]}
                          </span>
                          <span className="leading-relaxed">
                            <RichText
                              text={option}
                              marks={question.optionInline[optionIndex]}
                            />
                          </span>
                          {isCorrectOption ? (
                            <Check className="ml-auto size-3.5 shrink-0" />
                          ) : null}
                          {isPicked && !isCorrectOption ? (
                            <span className="ml-auto text-[10px] font-medium">
                              your answer
                            </span>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Leaderboard slug={subject.slug} />
      )}

      <div className="flex flex-col gap-2">
        <Button size="lg" className="h-12 rounded-xl" onClick={onRetry}>
          <RotateCcw />
          Try another set
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/quiz">Back to subjects</Link>
        </Button>
      </div>
    </div>
  )
}

type LeaderboardRow = {
  id: number
  nickname: string
  score: number
  total: number
  time_taken: number
  created_at: string
}

function Leaderboard({ slug }: { slug: string }) {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const res = await fetch(
          `/api/leaderboard/${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        )
        if (!res.ok) throw new Error("leaderboard unavailable")
        const data = (await res.json()) as LeaderboardRow[]
        if (active) setRows(Array.isArray(data) ? data : [])
      } catch {
        if (active) setFailed(true)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading leaderboard…
      </div>
    )
  }

  if (failed) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        The leaderboard is unavailable right now.
      </p>
    )
  }

  if (!rows.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No attempts yet. You could be first.
      </p>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" />
          Top scores
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-0 pt-0">
        {rows.slice(0, 10).map((row, rowIndex) => (
          <div
            key={row.id}
            className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0"
          >
            <span className="w-6 text-xs font-semibold text-muted-foreground tabular-nums">
              #{rowIndex + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">
              {row.nickname}
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {row.score}/{row.total}
            </span>
            <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
              {formatTaken(row.time_taken)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
