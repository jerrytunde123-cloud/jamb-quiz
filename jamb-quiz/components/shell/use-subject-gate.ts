"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { addRecentSubject } from "@/lib/recents"
import type { SubjectSummary } from "@/lib/quiz/types"

type Pending = {
  subject: SubjectSummary
  challenge?: { challenger: string; score: string } | null
}

/**
 * Tiny controller for the subject → gate → quiz handoff.
 * Returns the pending subject (or null), an opener, and the continue handler
 * that marks the short sessionStorage key, adds the recent, and navigates.
 */
export function useSubjectGate() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, setPending] = useState<Pending | null>(null)

  const challenge = useMemo(() => {
    const challenger = searchParams.get("challenger")
    const score = searchParams.get("score")
    if (!challenger || !score) return null
    return { challenger, score }
  }, [searchParams])

  const openGate = useCallback(
    (subject: SubjectSummary) => {
      setPending({ subject, challenge })
    },
    [challenge]
  )

  const continueToQuiz = useCallback(() => {
    if (!pending) return

    const { subject, challenge: c } = pending

    addRecentSubject(subject.slug)

    try {
      window.sessionStorage.setItem(`gate_unlocked_${subject.slug}`, "1")
    } catch {
      // private mode — ignore
    }

    const params = new URLSearchParams({ start: "1" })
    if (c && c.challenger) params.set("challenger", c.challenger)
    if (c && c.score) params.set("score", c.score)

    setPending(null)
    router.push(`/quiz/${encodeURIComponent(subject.slug)}?${params.toString()}`)
  }, [pending, router])

  return {
    pendingSubject: pending?.subject ?? null,
    isGateOpen: pending !== null,
    setIsGateOpen: (open: boolean) => {
      if (!open) setPending(null)
    },
    openGate,
    continueToQuiz,
  }
}