"use client"

import { useSearchParams } from "next/navigation"
import {
  BookOpen,
  History,
  Layers,
  RefreshCw,
  Swords,
  Trophy,
  X,
} from "lucide-react"
import { useMemo } from "react"

import { SubjectIcon } from "@/components/shell/subject-icon"
import { WhatsAppGate } from "@/components/shell/whatsapp-gate"
import { useSubjectGate } from "@/components/shell/use-subject-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MAX_RECENTS, useRecentSlugs } from "@/lib/recents"
import type { SubjectSummary } from "@/lib/quiz/types"
import { useLocalStorage } from "@/lib/use-local-storage"

type Challenge = {
  challenger: string
  score: string
  subjectName: string
}

export function SubjectGrid({ subjects }: { subjects: SubjectSummary[] }) {
  const searchParams = useSearchParams()
  const [recentSlugs, , clearRecents] = useRecentSlugs()
  const { pendingSubject, isGateOpen, setIsGateOpen, openGate, continueToQuiz } =
    useSubjectGate()

  const challenge = useMemo<Challenge | null>(() => {
    const challenger = searchParams.get("challenger")
    const score = searchParams.get("score")
    const subjectParam = searchParams.get("subject")

    if (!challenger || !score || !subjectParam) return null

    const match = subjects.find(
      (subject) =>
        subject.slug.toLowerCase() === subjectParam.toLowerCase() ||
        subject.name.toLowerCase() === subjectParam.toLowerCase()
    )

    return {
      challenger,
      score,
      subjectName: match?.name ?? subjectParam,
    }
  }, [searchParams, subjects])

  const recentSubjects = useMemo(
    () =>
      recentSlugs
        .map((slug) => subjects.find((subject) => subject.slug === slug))
        .filter((subject): subject is SubjectSummary => Boolean(subject))
        .slice(0, MAX_RECENTS),
    [recentSlugs, subjects]
  )

  if (subjects.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-6 sm:px-6">
        <Card className="items-center gap-3 border-border/70 bg-card/60 px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <BookOpen className="size-6" />
          </span>

          <div className="space-y-1">
            <h2 className="font-semibold">The question bank is taking a break</h2>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              We couldn&apos;t load the subjects right now. Check your connection
              and try again.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw />
            Refresh
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-6 sm:px-6">
        {challenge ? (
          <Card className="mb-8 gap-0 border-brand/30 bg-gradient-to-r from-brand/10 via-card to-brand-2/5 py-0">
            <div className="flex gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand ring-1 ring-brand/20">
                <Swords className="size-5" />
              </span>

              <div className="min-w-0">
                <p className="text-sm leading-relaxed">
                  <strong>{challenge.challenger}</strong> challenged you to beat{" "}
                  <strong>{challenge.score}/15</strong> in{" "}
                  {challenge.subjectName}!
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick the subject below to take the #1 spot.
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        {recentSubjects.length > 0 ? (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <History className="size-4 text-brand" />
                Recently Practiced
              </h2>

              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-muted-foreground"
                onClick={clearRecents}
              >
                <X />
                Clear
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {recentSubjects.map((subject) => (
                <SubjectCard
                  key={`recent-${subject.slug}`}
                  subject={subject}
                  onClick={() => openGate(subject)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className={recentSubjects.length > 0 ? "mt-8" : undefined}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-brand uppercase">
                Question bank
              </p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-bold tracking-tight">
                <Layers className="size-5 text-brand" />
                {recentSubjects.length > 0 ? "All Subjects" : "Pick a Subject"}
              </h2>
            </div>

            <span className="pb-1 text-xs text-muted-foreground">
              {subjects.length} subjects
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.slug}
                subject={subject}
                onClick={() => openGate(subject)}
              />
            ))}
          </div>
        </section>
      </div>

      <WhatsAppGate
        subject={pendingSubject}
        open={isGateOpen}
        onOpenChange={setIsGateOpen}
        onContinue={continueToQuiz}
      />
    </>
  )
}

function SubjectCard({
  subject,
  onClick,
}: {
  subject: SubjectSummary
  onClick: () => void
}) {
  const [best] = useLocalStorage(`best_${subject.slug}`)

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Start the ${subject.name} quiz`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick()
        }
      }}
      className="group relative min-h-36 gap-0 overflow-hidden border-border/70 bg-card/70 py-0 transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-card hover:shadow-lg hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand/15 to-brand-2/10 text-brand ring-1 ring-brand/15">
          <SubjectIcon subject={subject.slug} className="size-5" />
        </span>

        {best ? (
          <Badge
            variant="outline"
            className="h-5 gap-1 border-brand/30 bg-brand/10 px-1.5 text-[10px] font-semibold text-brand"
          >
            <Trophy />
            {best}%
          </Badge>
        ) : null}
      </div>

      <div className="px-4 pb-4">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
          {subject.name}
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {subject.count.toLocaleString()} questions
        </p>
      </div>

      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-brand to-brand-2 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </Card>
  )
}