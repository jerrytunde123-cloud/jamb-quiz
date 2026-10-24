"use client";

import { useWhatsAppShare } from "@/hooks/useWhatsAppShare";
import { OPTIONAL_CHANNEL } from "@/lib/constants";

interface ShareButtonProps {
  subjectName: string;
  subjectSlug: string;
}

/**
 * Share button with optional channel link.
 */
export function ShareButton({ subjectName, subjectSlug }: ShareButtonProps) {
  const { shareUrl, share } = useWhatsAppShare({ subjectName, subjectSlug });

  return (
    <div
      style={{
        marginTop: 14,
        paddingTop: 12,
        borderTop: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <a
        className="btn-wa"
        style={{
          background: "transparent",
          border: "1px solid #25d366",
          color: "#25d366",
          fontSize: 13,
          padding: "10px 14px",
          margin: 0,
          textDecoration: "none",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
        href={shareUrl()}
        onClick={share}
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="fab fa-whatsapp" aria-hidden="true" /> Share with Friends on WhatsApp
      </a>

      <p className="small" style={{ margin: "4px 0 0", textAlign: "center" }}>
        Optional channel:{" "}
        <a
          href={OPTIONAL_CHANNEL.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {OPTIONAL_CHANNEL.label}
        </a>
      </p>
    </div>
  );
}