"use client";

import { useCallback } from "react";

interface ShareOptions {
  subjectName: string;
  subjectSlug: string;
  customText?: string;
}

/**
 * Hook for generating WhatsApp share links.
 */
export function useWhatsAppShare({
  subjectName,
  subjectSlug,
  customText,
}: ShareOptions) {
  const shareUrl = useCallback(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = customText ?? `Practice 15 ${subjectName} JAMB past questions online! Take the quiz here: ${origin}/s/${subjectSlug}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [subjectName, subjectSlug, customText]);

  const share = useCallback(
    (e?: React.MouseEvent<HTMLAnchorElement>) => {
      e?.preventDefault();
      window.open(shareUrl(), "_blank", "noopener,noreferrer");
    },
    [shareUrl]
  );

  return { shareUrl, share };
}