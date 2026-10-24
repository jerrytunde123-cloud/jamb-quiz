"use client";

import type { Channel } from "@/lib/constants";

interface ChannelButtonProps {
  channel: Channel & {
    status: "idle" | "pending" | "done";
    secondsLeft: number;
  };
  onJoin: (channelId: Channel["id"]) => void;
}

/**
 * Individual channel button. Uses native <a> href for deep linking - no preventDefault!
 * On mobile, the href should be the whatsapp:// deep link for direct app opening.
 */
export function ChannelButton({ channel, onJoin }: ChannelButtonProps) {
  const { id, label, icon, href, deepLinkCode, status, secondsLeft } = channel;
  const isDone = status === "done";
  const isPending = status === "pending";

  // Determine the correct href based on device
  // On mobile, use deep link; on desktop, use web URL
  const getHref = () => {
    if (typeof window === "undefined") return href;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return isMobile ? `whatsapp://channel/${deepLinkCode}` : href;
  };

  // Handle click - only for tracking join state, don't prevent default
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDone || isPending) {
      e.preventDefault();
      return;
    }
    onJoin(id);
    // Let the native <a href> handle navigation - no preventDefault!
  };

  return (
    <a
      key={id}
      id={id + "Btn"}
      className={`btn-wa ${isDone ? "done" : ""} ${isPending ? "pending" : ""}`}
      href={getHref()}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={isDone ? `Joined ${label}` : `Join ${label}`}
      aria-disabled={isDone || isPending}
    >
      <i className={icon} aria-hidden="true" />
      <span>{label}</span>
      {isPending && secondsLeft > 0 ? (
        <span className="ch-timer" aria-live="polite">
          {secondsLeft}s
        </span>
      ) : isDone ? (
        <span className="ch-timer" aria-label="Joined">
          ✓
        </span>
      ) : null}
    </a>
  );
}