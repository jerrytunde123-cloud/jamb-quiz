import type { Metadata } from "next"
import { Suspense } from "react"

import { AssistancePanel } from "@/components/home/assistance-panel"
import { Hero } from "@/components/home/hero"
import { SiteFooter } from "@/components/home/site-footer"
import { SiteHeader } from "@/components/home/site-header"
import { SubjectBrowser } from "@/components/home/subject-browser"
import { SubjectGridSkeleton } from "@/components/home/subject-grid-skeleton"

export const metadata: Metadata = {
  title: "SUCCESS ACADEMY · UTME LAB — JAMB/WAEC Practice",
  description:
    "Practice 1000+ JAMB & WAEC questions. 15 questions · 5 minutes · randomised every attempt.",
}

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <Hero />

        <Suspense fallback={<SubjectGridSkeleton />}>
          <SubjectBrowser />
        </Suspense>

        <div className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-6">
          <AssistancePanel />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
