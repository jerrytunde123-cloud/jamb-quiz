"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  BookOpen,
  Check,
  History,
  Layers,
  Link2,
  RefreshCw,
  Swords,
  Trophy,
  X,
} from "lucide-react"
import { useMemo, useState } from "react"

import { WhatsAppGate } from "@/components/gate/whatsapp-gate"
import { SubjectIcon } from "@/components/home/subject-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useWhatsAppGate } from "@/hooks/use-whatsapp-gate"
import { addRecentSubject, MAX_RECENTS, useRecentSlugs } from "@/lib/recents"
import type { SubjectSummary } from "@/lib/quiz/types"
import { useLocalStorage } from "@/lib/use-local-storage"

type Challenge = {
  challenger: string
  score: string
  subjectName: string
  subjectSlug: string | null
}

export function Home({ subjects }: { subjects: SubjectSummary[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gate = useWhatsAppGate()
  const [recentSlugs, , clearRecents] = useRecentSlugs()
  const [pendingSubject, setPendingSubject] = useState<SubjectSummary | null>(
    null
  )
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

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
      subjectSlug: match?.slug ?? null,
    }
  }, [searchParams, subjects])

  const challengeSubject = useMemo(
    () =>
      challenge?.subjectSlug
        ? (subjects.find(
            (subject) => subject.slug === challenge.subjectSlug
          ) ?? null)
        : null,
    [challenge, subjects]
  )

  const recentSubjects = useMemo(
    () =>
      recentSlugs
        .map((slug) => subjects.find((subject) => subject.slug === slug))
        .filter((subject): subject is SubjectSummary => Boolean(subject))
        .slice(0, MAX_RECENTS),
    [recentSlugs, subjects]
  )

  function openGate(subject: SubjectSummary) {
    setPendingSubject(subject)
  }

  function continueToQuiz() {
    const subject = pendingSubject
    if (!subject) return

    addRecentSubject(subject.slug)

    try {
      // The parent app's short handoff key. It only covers the transition
      // from this modal to the quiz; it is not a long-lived unlock.
      window.sessionStorage.setItem(`gate_unlocked_${subject.slug}`, "1")
    } catch {
      // Private mode can block sessionStorage; the gate can still continue.
    }

    // Temporary bridge until the parent-style gate replaces the 30-day store.
    gate.unlock()

    const params = new URLSearchParams({ start: "1" })
    if (challenge && challenge.subjectSlug === subject.slug) {
      params.set("challenger", challenge.challenger)
      params.set("score", challenge.score)
    }

    setPendingSubject(null)
    router.push(`/quiz/${encodeURIComponent(subject.slug)}?${params.toString()}`)
  }

  async function share(slug: string) {
    const url = `${window.location.origin}/s/${encodeURIComponent(slug)}`

    try {
      await navigator.clipboard.writeText(url)
      setCopiedSlug(slug)
      window.setTimeout(() => setCopiedSlug(null), 1600)
    } catch {
      window.prompt("Copy this link:", url)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-6 sm:px-6">
      {challenge ? (
        <Card className="mt-6 gap-0 border-brand/30 bg-gradient-to-r from-brand/10 via-card to-brand-2/5 py-0">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
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
                  Can you step up and take the #1 spot?
                </p>
              </div>
            </div>

            {challengeSubject ? (
              <Button
                size="sm"
                className="shrink-0 self-start sm:self-auto"
                onClick={() => openGate(challengeSubject)}
              >
                Accept challenge
                <ArrowRight />
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {recentSubjects.length > 0 ? (
        <section className="mt-8">
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
                copied={copiedSlug === subject.slug}
                onSelect={openGate}
                onShare={share}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
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

          {subjects.length > 0 ? (
            <span className="pb-1 text-xs text-muted-foreground">
              {subjects.length} subjects
            </span>
          ) : null}
        </div>

        {subjects.length === 0 ? (
          <Card className="items-center gap-3 border-border/70 bg-card/60 px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <BookOpen className="size-6" />
            </span>
            <div className="space-y-1">
              <h3 className="font-semibold">The question bank is taking a break</h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                We couldn&apos;t load the subjects right now. Check your
                connection and try again.
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
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.slug}
                subject={subject}
                copied={copiedSlug === subject.slug}
                onSelect={openGate}
                onShare={share}
              />
            ))}
          </div>
        )}
      </section>

      <WhatsAppGate
        subject={pendingSubject}
        open={pendingSubject !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSubject(null)
        }}
        onContinue={continueToQuiz}
      />
    </div>
  )
}

function SubjectCard({
  subject,
  copied,
  onSelect,
  onShare,
}: {
  subject: SubjectSummary
  copied: boolean
  onSelect: (subject: SubjectSummary) => void
  onShare: (slug: string) => void
}) {
  const [best] = useLocalStorage(`best_${subject.slug}`)

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Start the ${subject.name} quiz`}
      onClick={() => onSelect(subject)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect(subject)
        }
      }}
      className="group relative min-h-36 cursor-pointer gap-0 overflow-hidden border-border/70 bg-card/70 py-0 transition duration-200 outline-none hover:-translate-y-0.5 hover:border-brand/50 hover:bg-card hover:shadow-lg hover:shadow-black/20 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-2 p-3.5 pb-2">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand/15 to-brand-2/10 text-brand ring-1 ring-brand/15">
          <SubjectIcon subject={subject.slug} className="size-5" />
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={copied ? "Link copied" : `Copy ${subject.name} share link`}
          title={copied ? "Copied" : "Copy share link"}
          className="-mt-1 -mr-1 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation()
            onShare(subject.slug)
          }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {copied ? (
            <Check className="text-success" />
          ) : (
            <Link2 className="group-hover/card:text-brand" />
          )}
        </Button>
      </div>

      <div className="px-3.5 pb-3.5">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
          {subject.name}
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {subject.count.toLocaleString()} questions
        </p>

        {best ? (
          <Badge
            variant="outline"
            className="mt-2 h-5 gap-1 border-brand/30 bg-brand/10 px-1.5 text-[10px] font-semibold text-brand"
          >
            <Trophy />
            {best}%
          </Badge>
        ) : null}
      </div>

      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-brand to-brand-2 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </Card>
  )
}
