"use client"

import { Flame } from "lucide-react"

import { useStreak } from "@/hooks/use-streak"

export function StreakPill() {
  const streak = useStreak()

  if (streak < 1) return null

  return (
    <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-sm font-semibold text-brand">
      <Flame className="size-4 fill-brand/20" />
      {streak}-Day Practice Streak!
    </div>
  )
}
