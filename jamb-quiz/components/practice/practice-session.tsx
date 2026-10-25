"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CircleCheck, CircleX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { DemoQuestion } from "@/lib/demo/questions"

type PracticeSessionProps = {
  questions: readonly DemoQuestion[]
  projectedScore: number
  fallbackFocus: string
}

export function PracticeSession({
  questions,
  projectedScore,
  fallbackFocus,
}: PracticeSessionProps) {
  const total = questions.length
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongTopics, setWrongTopics] = useState<string[]>([])
  const [finished, setFinished] = useState(false)

  if (total === 0) return null

  const question = questions[index]
  const correctOption = question.options.find(
    (option) => option.id === question.correctOptionId
  )
  const isCorrect = selected === question.correctOptionId
  const isLast = index === total - 1

  function checkAnswer() {
    if (!selected || checked) return

    setChecked(true)
    if (selected === question.correctOptionId) {
      setCorrectCount((count) => count + 1)
    } else {
      setWrongTopics((topics) => [...topics, question.topic])
    }
  }

  function nextQuestion() {
    if (isLast) {
      setFinished(true)
      return
    }

    setIndex((current) => current + 1)
    setSelected(null)
    setChecked(false)
  }

  if (finished) {
    const focus = wrongTopics[0] ?? fallbackFocus
    const missedToday = wrongTopics.length > 0
    const percentage = Math.round((correctCount / total) * 100)

    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-5 py-10">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Session complete</p>
          <h1 className="text-5xl font-semibold tracking-tight tabular-nums">
            {correctCount} / {total}
          </h1>
          <p className="text-muted-foreground">
            {percentage >= 80
              ? "Strong session. Keep this up."
              : percentage >= 50
                ? "Solid work. Keep the streak going."
                : "Rough one. Tomorrow is a fresh start."}
          </p>
        </div>

        <div className="space-y-1 rounded-xl border border-border/60 p-4">
          <p className="text-xs text-muted-foreground">
            Your JAMB estimate
          </p>
          <p className="text-3xl font-semibold tabular-nums">
            {projectedScore}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              / 400
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Sample estimate from your practice history.
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Fix this next
          </p>
          <p className="text-base font-medium">{focus}</p>
          <p className="text-sm text-muted-foreground">
            {missedToday
              ? "You missed this in today's session."
              : "Your weakest topic overall."}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <Link href="/progress">
              See your progress
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Done for today</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Exit
        </Link>
        <span className="text-sm text-muted-foreground">
          Question {index + 1} of {total}
        </span>
      </div>

      <Progress value={((index + 1) / total) * 100} className="h-1.5" />

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {question.subject}
        </p>
        <h1 className="text-xl font-medium leading-snug sm:text-2xl">
          {question.stem}
        </h1>
      </div>

      <div className="space-y-2">
        {question.options.map((option, optionIndex) => {
          const letter = String.fromCharCode(65 + optionIndex)
          const isSelected = selected === option.id
          const isCorrectOption = option.id === question.correctOptionId

          return (
            <Button
              key={option.id}
              type="button"
              variant="outline"
              aria-pressed={isSelected}
              aria-disabled={checked}
              onClick={() => {
                if (!checked) setSelected(option.id)
              }}
              className={cn(
                "h-auto min-h-12 w-full justify-start gap-3 rounded-xl px-4 py-3 text-left text-sm font-normal whitespace-normal",
                checked ? "pointer-events-none" : null,
                !checked && isSelected
                  ? "border-primary bg-primary/5"
                  : null,
                checked && isCorrectOption
                  ? "border-primary bg-primary/10"
                  : null,
                checked && isSelected && !isCorrectOption
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : null,
                checked && !isSelected && !isCorrectOption
                  ? "opacity-60"
                  : null
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs">
                {letter}
              </span>
              <span className="pt-0.5">{option.text}</span>
            </Button>
          )
        })}
      </div>

      {checked ? (
        <div
          aria-live="polite"
          className="space-y-3 rounded-xl border border-border/60 p-4"
        >
          <div
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              isCorrect ? "text-primary" : "text-destructive"
            )}
          >
            {isCorrect ? (
              <CircleCheck className="size-4" />
            ) : (
              <CircleX className="size-4" />
            )}
            {isCorrect ? "Correct" : "Not quite"}
          </div>

          {!isCorrect && correctOption ? (
            <p className="text-sm">
              The answer is{" "}
              <span className="font-medium">{correctOption.text}</span>.
            </p>
          ) : null}

          <p className="text-sm text-muted-foreground">
            {question.explanation}
          </p>
        </div>
      ) : null}

      <div className="mt-auto">
        {checked ? (
          <Button size="lg" className="w-full" onClick={nextQuestion}>
            {isLast ? "See result" : "Next question"}
            <ArrowRight />
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={!selected}
            onClick={checkAnswer}
          >
            Check answer
          </Button>
        )}
      </div>
    </div>
  )
}
