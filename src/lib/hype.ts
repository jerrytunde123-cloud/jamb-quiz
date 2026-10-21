/**
 * Nigerian JAMB Exam Hype System.
 * Generates culturally authentic, motivating titles, quotes, and badges
 * designed to spark bragging and viral sharing across WhatsApp study groups.
 */

export interface HypeResult {
  tier: "overlord" | "scholar" | "candidate" | "rookie";
  badge: string;
  emoji: string;
  tagline: string;
  quote: string;
  color: string;
  isSpeedDemon: boolean;
  speedText?: string;
}

export function getHypeResult(
  score: number,
  total: number,
  timeTakenSeconds = 0
): HypeResult {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const isSpeedDemon = timeTakenSeconds > 0 && timeTakenSeconds <= 130 && score >= 10;
  const minutes = Math.floor(timeTakenSeconds / 60);
  const seconds = timeTakenSeconds % 60;
  const timeFormatted = `${minutes}m ${seconds}s`;

  if (pct >= 90) {
    return {
      tier: "overlord",
      badge: "JAMB OVERLORD",
      emoji: "👑",
      tagline: "350+ Aggregate Energy",
      quote: "Omo! UNILAG, UI, and OAU are already preparing your admission letter! Pure Scholar status!",
      color: "#f5a623",
      isSpeedDemon,
      speedText: isSpeedDemon ? `⚡ Speed Demon: Finished in ${timeFormatted}!` : undefined,
    };
  }

  if (pct >= 70) {
    return {
      tier: "scholar",
      badge: "FIRST CHOICE SCHOLAR",
      emoji: "🔥",
      tagline: "Solid 300+ Potential",
      quote: "You understand the assignment! Keep this momentum and your first choice course is locked.",
      color: "#ff6b35",
      isSpeedDemon,
      speedText: isSpeedDemon ? `⚡ Speed Demon: Finished in ${timeFormatted}!` : undefined,
    };
  }

  if (pct >= 50) {
    return {
      tier: "candidate",
      badge: "SERIOUS CANDIDATE",
      emoji: "⚡",
      tagline: "Work in Progress",
      quote: "You're on the right track! Drill 2 more past question sets today to push past the 280+ zone.",
      color: "#38bdf8",
      isSpeedDemon: false,
    };
  }

  return {
    tier: "rookie",
    badge: "WAKE UP JAMBITE!",
    emoji: "📚",
    tagline: "Back to the Syllabus",
    quote: "No gree for JAMB o! Retake this quiz right now, review your corrections, and redeem your score!",
    color: "#ef4444",
    isSpeedDemon: false,
  };
}
