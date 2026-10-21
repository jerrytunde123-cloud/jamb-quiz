/**
 * Daily Practice Streak tracker.
 * Encourages students to return every single day to keep their streak flame burning.
 */

const STREAK_KEY = "jamb_daily_streak";
const LAST_DATE_KEY = "jamb_last_practice_date";

export interface StreakInfo {
  streak: number;
  isTodayRecorded: boolean;
}

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getStreakInfo(): StreakInfo {
  if (typeof window === "undefined") {
    return { streak: 1, isTodayRecorded: false };
  }

  const lastDate = window.localStorage.getItem(LAST_DATE_KEY);
  const rawStreak = Number(window.localStorage.getItem(STREAK_KEY)) || 0;
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (!lastDate) {
    return { streak: 0, isTodayRecorded: false };
  }

  if (lastDate === today) {
    return { streak: Math.max(1, rawStreak), isTodayRecorded: true };
  }

  if (lastDate === yesterday) {
    return { streak: Math.max(1, rawStreak), isTodayRecorded: false };
  }

  // Streak broken
  return { streak: 0, isTodayRecorded: false };
}

/** Record that the student practiced today. Increments streak if continuing. */
export function recordPracticeDay(): number {
  if (typeof window === "undefined") return 1;

  const today = getTodayString();
  const yesterday = getYesterdayString();
  const lastDate = window.localStorage.getItem(LAST_DATE_KEY);
  const rawStreak = Number(window.localStorage.getItem(STREAK_KEY)) || 0;

  let newStreak = 1;

  if (lastDate === today) {
    // Already recorded today
    return Math.max(1, rawStreak);
  }

  if (lastDate === yesterday) {
    newStreak = rawStreak + 1;
  } else {
    newStreak = 1;
  }

  window.localStorage.setItem(LAST_DATE_KEY, today);
  window.localStorage.setItem(STREAK_KEY, String(newStreak));
  return newStreak;
}
