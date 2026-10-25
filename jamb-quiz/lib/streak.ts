/**
 * Daily practice streak.
 *
 * The parent app keeps the streak on the device; there is no account and no
 * server-side streak. Storage keys are unchanged so existing students keep
 * their streak when they move to this build.
 */
const STREAK_KEY = "jamb_daily_streak"
const LAST_DATE_KEY = "jamb_last_practice_date"

export const STREAK_EVENT = "local-storage:jamb_streak"

export interface StreakInfo {
  streak: number
  isTodayRecorded: boolean
}

function todayString(): string {
  return dateString(new Date())
}

function yesterdayString(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return dateString(date)
}

function dateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Read the current streak. Returns 0 during server rendering. */
export function getStreakInfo(): StreakInfo {
  if (typeof window === "undefined") {
    return { streak: 0, isTodayRecorded: false }
  }

  const lastDate = window.localStorage.getItem(LAST_DATE_KEY)
  const rawStreak = Number(window.localStorage.getItem(STREAK_KEY)) || 0
  const today = todayString()
  const yesterday = yesterdayString()

  if (!lastDate) {
    return { streak: 0, isTodayRecorded: false }
  }

  if (lastDate === today) {
    return { streak: Math.max(1, rawStreak), isTodayRecorded: true }
  }

  if (lastDate === yesterday) {
    return { streak: Math.max(1, rawStreak), isTodayRecorded: false }
  }

  return { streak: 0, isTodayRecorded: false }
}

/** Record practice for today and return the new streak. */
export function recordPracticeDay(): number {
  if (typeof window === "undefined") return 1

  const today = todayString()
  const lastDate = window.localStorage.getItem(LAST_DATE_KEY)
  const rawStreak = Number(window.localStorage.getItem(STREAK_KEY)) || 0

  if (lastDate === today) {
    window.dispatchEvent(new Event(STREAK_EVENT))
    return Math.max(1, rawStreak)
  }

  const next = lastDate === yesterdayString() ? rawStreak + 1 : 1

  window.localStorage.setItem(LAST_DATE_KEY, today)
  window.localStorage.setItem(STREAK_KEY, String(next))
  window.dispatchEvent(new Event(STREAK_EVENT))

  return next
}
