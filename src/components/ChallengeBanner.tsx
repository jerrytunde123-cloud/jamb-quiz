"use client";

interface ChallengeInfo {
  challenger: string;
  score: string;
}

interface ChallengeBannerProps {
  challengeInfo: ChallengeInfo | null;
}

/**
 * Displays challenge information if available.
 */
export function ChallengeBanner({ challengeInfo }: ChallengeBannerProps) {
  if (!challengeInfo) return null;

  return (
    <div
      style={{
        background: "rgba(245, 166, 35, 0.12)",
        border: "1px solid rgba(245, 166, 35, 0.35)",
        borderRadius: 10,
        padding: "8px 12px",
        margin: "8px 0 14px",
        fontSize: 13,
      }}
    >
      ⚔️ <strong>{challengeInfo.challenger}</strong> challenged you to beat{" "}
      <strong style={{ color: "var(--primary)" }}>{challengeInfo.score}/15</strong>!
    </div>
  );
}