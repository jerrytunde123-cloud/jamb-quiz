import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ShareReportButton } from "@/components/progress/share-report-button"
import { DEMO_STUDENT } from "@/lib/demo/catalog"
import { buildDemoDashboard } from "@/lib/demo/dashboard"

export const metadata: Metadata = {
  title: "Your progress — JAMB Readiness",
}

export default function ProgressPage() {
  const { projected, subjects, weakTopics } = buildDemoDashboard()
  const gap = projected.score - projected.goal
  const focusTopics = weakTopics.slice(0, 2)

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="mx-auto flex w-full max-w-md items-center gap-2 px-5 pt-6">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/" aria-label="Back to today">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-base font-medium">Your progress</h1>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-8 px-5 py-6">
        <section className="space-y-2">
          <p className="text-sm text-muted-foreground">Your JAMB score</p>
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
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-medium">Your subjects</h2>
          <ul className="space-y-4">
            {subjects.map((subject) => (
              <li key={subject.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">
                    {subject.name}
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {subject.readiness}%
                    </span>
                    {subject.band === "at-risk" ? (
                      <span className="text-xs text-destructive">
                        Needs work
                      </span>
                    ) : null}
                  </span>
                </div>
                <Progress
                  value={subject.readiness}
                  className="h-1.5"
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-medium">What to work on</h2>
          <ul className="space-y-2">
            {focusTopics.map((topic) => (
              <li
                key={topic.id}
                className="rounded-xl border border-border/60 p-3"
              >
                <p className="text-sm font-medium">{topic.topic}</p>
                <p className="text-xs text-muted-foreground">
                  {topic.subject} · {topic.accuracy}% correct
                </p>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="w-full">
            <Link href="/practice">
              Practice now
              <ArrowRight />
            </Link>
          </Button>
        </section>

        <section className="space-y-3 rounded-xl border border-border/60 p-4">
          <div>
            <p className="text-sm font-medium">For parents</p>
            <p className="text-sm text-muted-foreground">
              Share a read-only report. No parent account needed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/report/demo">
                Open report
                <ArrowRight />
              </Link>
            </Button>
            <ShareReportButton
              reportPath="/report/demo"
              studentName={DEMO_STUDENT.name}
            />
          </div>
        </section>
      </main>
    </div>
  )
}
