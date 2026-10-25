import { Suspense } from "react"

import { AssistancePanel } from "@/components/shell/assistance-panel"
import { Hero } from "@/components/shell/hero"
import { SiteFooter } from "@/components/shell/site-footer"
import { SiteHeader } from "@/components/shell/site-header"
import { SubjectBrowser } from "@/components/shell/subject-browser"
import { SubjectGridSkeleton } from "@/components/shell/subject-grid-skeleton"

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <Hero />

        <Suspense fallback={<SubjectGridSkeleton />}>
          <SubjectBrowser />
        </Suspense>

        <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <AssistancePanel />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
