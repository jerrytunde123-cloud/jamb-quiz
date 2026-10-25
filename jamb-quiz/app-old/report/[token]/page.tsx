import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { GraduationCap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DEMO_NOW } from "@/lib/demo/attempts"
import { DEMO_STUDENT } from "@/lib/demo/catalog"
import { buildDemoDashboard } from "@/lib/demo/dashboard"

export const metadata: Metadata = {
  title: "Progress report — JAMB Readiness",
}

// A parent report is a one-off read, not an in-app navigation. Let it block
// so an invalid token can show the report's own not-found UI.
export const instant = false

const BAND_META = {
  strong: { label: "Strong", variant: "default" },
  "on-track": { label: "On track", variant: "secondary" },
  "at-risk": { label: "At risk", variant: "destructive" },
} as const

function signed(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}

export default async function ReportPage({
  params,
}: PageProps<"/report/[token]">) {
  const { token } = await params
  if (token !== "demo") notFound()

  const { projected, subjects, weakTopics } = buildDemoDashboard()
  const answered = subjects.reduce(
    (total, subject) => total + subject.questionsAttempted,
    0
  )
  const gap = projected.score - projected.goal
  const reportDate = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(DEMO_NOW)

  return (
    <div className="flex flex-1 flex-col bg-background">
      <ReportHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-6 sm:px-6 sm:py-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Progress report for {DEMO_STUDENT.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {DEMO_STUDENT.label} · {reportDate} · shared from the student’s
            account
          </p>
        </div>

        <Card>
          <CardContent className="grid gap-6 sm:grid-cols-[1.2fr_1fr] sm:items-center">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Projected JAMB score
              </p>
              <div className="flex items-end gap-2">
                <span className="text-6xl font-semibold leading-none tracking-tight tabular-nums">
                  {projected.score}
                </span>
                <span className="pb-1.5 text-sm text-muted-foreground">
                  / 400
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Likely between{" "}
                <span className="font-medium text-foreground">
                  {projected.low}
                </span>{" "}
                and{" "}
                <span className="font-medium text-foreground">
                  {projected.high}
                </span>
                .
              </p>
              <p className="text-sm text-muted-foreground">
                Goal {projected.goal} ·{" "}
                {gap >= 0
                  ? `${gap} marks above`
                  : `${Math.abs(gap)} marks to go`}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  This week: {signed(projected.sinceLastWeek)}
                </Badge>
                <Badge variant="outline">
                  This month: {signed(projected.sinceLastMonth)}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  Confidence
                </p>
                <p className="font-medium">
                  {projected.confidenceLabel}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  Syllabus covered
                </p>
                <p className="font-medium tabular-nums">
                  {projected.coverage}%
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  Questions answered
                </p>
                <p className="font-medium tabular-nums">
                  {answered.toLocaleString("en-NG")}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  Pace
                </p>
                <p className="font-medium">
                  {projected.timingRisk ? "Timing risk" : "On exam pace"}
                </p>
              </div>
              <p className="col-span-2 text-xs text-muted-foreground">
                {projected.confidenceNote}
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-medium">Subjects</h2>
            <p className="text-sm text-muted-foreground">
              Where the projected score comes from.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {subjects.map((subject) => {
              const band = BAND_META[subject.band]
              const delta = subject.readiness - subject.previousReadiness

              return (
                <Card key={subject.id} size="sm">
                  <CardHeader>
                    <CardTitle>{subject.name}</CardTitle>
                    <CardAction>
                      <div className="flex items-center gap-1">
                        {subject.timingRisk ? (
                          <Badge variant="destructive">
                            Timing risk
                          </Badge>
                        ) : null}
                        <Badge variant={band.variant}>
                          {band.label}
                        </Badge>
                      </div>
                    </CardAction>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-semibold leading-none tabular-nums">
                        {subject.readiness}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / 100
                      </span>
                    </div>
                    <Progress
                      value={subject.readiness}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {subject.accuracy}% accuracy ·{" "}
                      {subject.questionsAttempted} questions
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {signed(delta)} vs last month
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Weakest topics</CardTitle>
            <CardDescription>
              Ranked by expected marks lost, not raw accuracy.
            </CardDescription>
            <CardAction>
              <Badge variant="destructive">
                {weakTopics.length} to fix
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {weakTopics.map((topic) => (
                <li
                  key={topic.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {topic.topic}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {topic.subject} · {topic.accuracy}% correct ·{" "}
                      {topic.attempts} attempts
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-destructive">
                    ≈{topic.expectedMarksLost} marks
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <details className="rounded-xl border border-border/60 p-4">
          <summary className="cursor-pointer text-sm font-medium">
            How to read this report
          </summary>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                Projected score
              </span>{" "}
              is where {DEMO_STUDENT.name} is heading if the exam were today.
              The range is the 90% interval.
            </p>
            <p>
              <span className="font-medium text-foreground">
                Confidence
              </span>{" "}
              rises with more questions and broader syllabus coverage. Low
              coverage keeps the estimate cautious.
            </p>
            <p>
              <span className="font-medium text-foreground">
                Marks at stake
              </span>{" "}
              shows which topics are costing the most marks, weighted by the
              exam blueprint.
            </p>
          </div>
        </details>

        <footer className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
          Generated {reportDate} · {projected.modelVersion} · sample data
        </footer>
      </main>
    </div>
  )
}

function ReportHeader() {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">JAMB Readiness</p>
            <p className="text-[11px] text-muted-foreground">
              Progress report
            </p>
          </div>
        </div>
        <Badge variant="outline">Sample data</Badge>
      </div>
    </header>
  )
}
