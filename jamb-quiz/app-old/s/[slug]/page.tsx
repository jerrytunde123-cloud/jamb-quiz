import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { resolveSubject } from "@/lib/quiz/service"

export const instant = false

type SharePageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { slug } = await params
  const subject = await resolveSubject(slug)

  return {
    title: subject ? `${subject.name} challenge` : "Challenge",
  }
}

export default async function SharePage({
  params,
  searchParams,
}: SharePageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const subject = await resolveSubject(slug)

  const target = new URLSearchParams()
  target.set("subject", subject?.slug ?? slug)

  const challenger = first(query.challenger)
  const score = first(query.score)

  if (challenger) target.set("challenger", challenger)
  if (score) target.set("score", score)

  redirect(`/?${target.toString()}`)
}
