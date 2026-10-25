import type { Metadata } from "next"

import { PracticeSession } from "@/components/practice/practice-session"
import { buildDemoDashboard } from "@/lib/demo/dashboard"
import { demoQuestions } from "@/lib/demo/questions"

export const metadata: Metadata = {
  title: "Practice — JAMB Readiness",
}

export default function PracticePage() {
  const { projected, weakTopics } = buildDemoDashboard()

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PracticeSession
        questions={demoQuestions}
        projectedScore={projected.score}
        fallbackFocus={weakTopics[0]?.topic ?? "Organic chemistry"}
      />
    </div>
  )
}
