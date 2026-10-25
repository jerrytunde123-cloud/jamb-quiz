import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SubjectEntry } from "@/components/quiz/subject-entry"
import { resolveSubject } from "@/lib/quiz/service"

// This route reads params directly. The real quiz page will stream its data,
// so let this segment block instead of failing the instant-navigation check.
export const instant = false

export async function generateMetadata({
  params,
}: PageProps<"/quiz/[subject]">): Promise<Metadata> {
  const { subject: slug } = await params
  const subject = await resolveSubject(slug)

  return {
    title: subject ? `${subject.name} — JAMB Practice` : "Subject — JAMB Practice",
    description: subject
      ? `15 ${subject.name} questions · 5 minutes · randomised every attempt.`
      : undefined,
  }
}

export default async function QuizSubjectPage({
  params,
}: PageProps<"/quiz/[subject]">) {
  const { subject: slug } = await params
  const subject = await resolveSubject(slug)

  if (!subject) notFound()

  return <SubjectEntry subject={{ slug: subject.slug, name: subject.name }} />
}
