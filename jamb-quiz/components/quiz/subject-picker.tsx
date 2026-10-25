"use client"

import { useRouter } from "next/navigation"
import {
  Atom,
  BookMarked,
  BookOpen,
  Calculator,
  Check,
  Dna,
  FlaskConical,
  GraduationCap,
  Landmark,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"

import { WhatsAppGate } from "@/components/gate/whatsapp-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWhatsAppGate } from "@/hooks/use-whatsapp-gate"
import { isGateUnlocked } from "@/lib/gate/store"
import type { QuizSubject, QuizSubjectIcon } from "@/lib/quiz/subjects"

const SUBJECT_ICONS: Record<QuizSubjectIcon, LucideIcon> = {
  "book-open": BookOpen,
  calculator: Calculator,
  atom: Atom,
  flask: FlaskConical,
  dna: Dna,
  "trending-up": TrendingUp,
  landmark: Landmark,
  "book-marked": BookMarked,
}

type SubjectPickerProps = {
  subjects: readonly QuizSubject[]
}

export function SubjectPicker({ subjects }: SubjectPickerProps) {
  const router = useRouter()
  const gate = useWhatsAppGate()
  const [pendingSubject, setPendingSubject] = useState<QuizSubject | null>(
    null
  )

  function chooseSubject(subject: QuizSubject) {
    // Read the store directly. The hook's snapshot is fine for the badge, but
    // this check must be fresh even if the click happens on the first frame.
    if (isGateUnlocked()) {
      router.push(`/quiz/${subject.slug}`)
      return
    }

    setPendingSubject(subject)
  }

  function continueToQuiz() {
    const subject = pendingSubject
    if (!subject) return

    gate.unlock()
    setPendingSubject(null)
    router.push(`/quiz/${subject.slug}`)
  }

  return (
    <>
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 pt-6">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Success Academy</p>
            <p className="text-xs text-muted-foreground">JAMB Practice</p>
          </div>
        </div>

        {gate.isUnlocked ? (
          <Badge variant="secondary">
            <Check />
            Unlocked
          </Badge>
        ) : null}
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-8">
        <section className="space-y-3">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            UTME Lab
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Pick a subject
          </h1>
          <p className="text-muted-foreground">
            15 questions. 5 minutes. Free.
            <br />
            One quick WhatsApp join unlocks every subject for 30 days.
          </p>
        </section>

        <section className="mt-8">
          <div className="grid grid-cols-2 gap-3">
            {subjects.map((subject) => {
              const Icon = SUBJECT_ICONS[subject.icon]

              return (
                <Button
                  key={subject.slug}
                  type="button"
                  variant="outline"
                  className="h-auto min-h-28 flex-col items-start justify-start gap-3 rounded-xl p-4 text-left whitespace-normal"
                  onClick={() => chooseSubject(subject)}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    {subject.compulsory ? (
                      <Badge
                        variant="secondary"
                        className="h-4 px-1.5 text-[10px]"
                      >
                        Required
                      </Badge>
                    ) : null}
                  </span>

                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium">
                      {subject.name}
                    </span>
                    <span className="block text-xs leading-snug font-normal text-muted-foreground">
                      {subject.tagline}
                    </span>
                  </span>
                </Button>
              )
            })}
          </div>
        </section>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          More subjects will appear as the question bank grows.
        </p>
      </main>

      <WhatsAppGate
        subject={pendingSubject}
        open={pendingSubject !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSubject(null)
        }}
        onContinue={continueToQuiz}
      />
    </>
  )
}
