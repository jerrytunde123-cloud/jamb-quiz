"use client";

import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";

export const CHANNELS = [
  {
    id: "ch1",
    label: "Join Main Channel",
    icon: "fab fa-whatsapp",
    href: "https://whatsapp.com/channel/0029VbD2bkWLNSZwxGpz2k0x",
  },
  {
    id: "ch2",
    label: "JAMB UTME",
    icon: "fab fa-whatsapp",
    href: "https://whatsapp.com/channel/0029VbDTOmB1t90jcv9gLf0q",
  },
];

export const OPTIONAL_CHANNEL = {
  label: "2027 JAMBITES",
  href: "https://whatsapp.com/channel/0029VbCwT4KAojYzRNFvpT1h",
};

/**
 * Mobile WhatsApp deep link interceptor.
 * Opens native WhatsApp app directly on mobile devices with fallback to web URL.
 */
export function handleWhatsAppDeepLink(
  e: React.MouseEvent<HTMLAnchorElement>,
  httpsUrl: string
) {
  const match = httpsUrl.match(/whatsapp\.com\/channel\/([A-Za-z0-9]+)/);
  if (!match) return;

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isMobile) return;

  e.preventDefault();
  const channelCode = match[1];
  const deepLink = `whatsapp://channel/${channelCode}`;

  // Open in a new context so the gate modal's state survives on Safari/iOS,
  // which would otherwise unload this document on scheme navigation.
  const opened = window.open(deepLink, "_blank");
  setTimeout(() => {
    try {
      if (!opened || opened.closed) {
        window.open(httpsUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      window.open(httpsUrl, "_blank", "noopener,noreferrer");
    }
  }, 1200);
}

interface WhatsAppGateProps {
  subjectName: string;
  subjectSlug: string;
  isOpen: boolean;
  onClose?: () => void;
  onUnlocked: (nickname: string) => void;
  challengeInfo?: {
    challenger: string;
    score: string;
  } | null;
}

export function WhatsAppGate({
  subjectName,
  subjectSlug,
  isOpen,
  onClose,
  onUnlocked,
  challengeInfo,
}: WhatsAppGateProps) {
  const [step, setStep] = useState<"gate" | "nickname">("gate");
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState<Record<string, number>>({});
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const [storedNickname, setStoredNickname] = useLocalStorage("nickname");
  const [nicknameInput, setNicknameInput] = useState("");

  const pendingChannels = useRef<Set<string>>(new Set());

  useEffect(() => {
    function completePending() {
      // Safari/Chrome may throttle setInterval while the tab is backgrounded
      // (e.g. after opening WhatsApp). When the user returns, finish any
      // in-flight channel joins immediately.
      pendingChannels.current.forEach((chId) => {
        const iv = timers.current[chId];
        if (iv) {
          clearInterval(iv);
          delete timers.current[chId];
        }
        setSecondsLeft((prev) => ({ ...prev, [chId]: 0 }));
        setJoined((prev) => ({ ...prev, [chId]: true }));
      });
      pendingChannels.current.clear();
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") completePending();
    };
    const onFocus = () => completePending();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
    };
  }, []);

  function handleClose() {
    Object.values(timers.current).forEach((iv) => clearInterval(iv));
    timers.current = {};
    onClose?.();
  }

  if (!isOpen) return null;

  function handleChannelClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    chId: string,
    href: string
  ) {
    if (joined[chId] || timers.current[chId]) return;

    handleWhatsAppDeepLink(e, href);

    pendingChannels.current.add(chId);

    let sec = 5;
    setSecondsLeft((prev) => ({ ...prev, [chId]: sec }));

    const iv = setInterval(() => {
      sec--;
      if (sec <= 0) {
        clearInterval(iv);
        delete timers.current[chId];
        pendingChannels.current.delete(chId);
        setSecondsLeft((prev) => ({ ...prev, [chId]: 0 }));
        setJoined((prev) => ({ ...prev, [chId]: true }));
      } else {
        setSecondsLeft((prev) => ({ ...prev, [chId]: sec }));
      }
    }, 1000);

    timers.current[chId] = iv;
  }

  const allChannelsReady = CHANNELS.every((c) => joined[c.id]);

  function handleContinue() {
    if (!allChannelsReady) return;
    setNicknameInput(storedNickname || "");
    setStep("nickname");
  }

  function handleStartQuiz() {
    const finalNick = nicknameInput.trim() || storedNickname || "Anonymous";
    setStoredNickname(finalNick);
    onUnlocked(finalNick);
  }

  function handleShareClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = `Practice 15 ${subjectName} JAMB past questions online! Take the quiz here: ${origin}/s/${subjectSlug}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const fallbackShareText = `Practice 15 ${subjectName} JAMB past questions online! Take the quiz here: /s/${subjectSlug}`;

  return (
    <>
      {step === "gate" && (
        <div className="gate" id="gate" onClick={handleClose}>
          <div className="gate-card" onClick={(e) => e.stopPropagation()}>
            {onClose && (
              <button
                type="button"
                className="close-x"
                onClick={handleClose}
                title="Close modal"
              >
                ✕
              </button>
            )}
            <div className="gate-icon">
              <i className="fab fa-whatsapp" style={{ color: "#25d366" }} />
            </div>
            <h3>Join Both Channels to Unlock</h3>
            {challengeInfo ? (
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
            ) : (
              <p>
                You must join <strong>both</strong> WhatsApp channels before
                starting the <strong>{subjectName}</strong> quiz.
              </p>
            )}

            {CHANNELS.map((c) => {
              const isDone = joined[c.id];
              const sec = secondsLeft[c.id];
              return (
                <a
                  key={c.id}
                  id={c.id + "Btn"}
                  className={`btn-wa ${isDone ? "done" : ""}`}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleChannelClick(e, c.id, c.href)}
                >
                  <i className={c.icon} />
                  <span>{c.label}</span>
                  {typeof sec === "number" && sec > 0 ? (
                    <span className="ch-timer">{sec}s</span>
                  ) : isDone ? (
                    <span className="ch-timer">✓</span>
                  ) : null}
                </a>
              );
            })}

            <button
              className="continue-btn"
              id="continueBtn"
              disabled={!allChannelsReady}
              onClick={handleContinue}
            >
              <i
                className={`fas ${allChannelsReady ? "fa-unlock" : "fa-lock"}`}
                style={{ marginRight: 6 }}
              />
              Continue to Quiz
            </button>

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
                }}
                href={`https://wa.me/?text=${encodeURIComponent(fallbackShareText)}`}
                onClick={handleShareClick}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-whatsapp" /> Share with Friends on WhatsApp
              </a>

              <p className="small" style={{ margin: "4px 0 0" }}>
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
          </div>
        </div>
      )}

      {step === "nickname" && (
        <div className="gate" id="nicknameModal" onClick={handleClose}>
          <div className="gate-card" onClick={(e) => e.stopPropagation()}>
            {onClose && (
              <button
                type="button"
                className="close-x"
                onClick={handleClose}
                title="Close modal"
              >
                ✕
              </button>
            )}
            <h3>Enter Your Nickname</h3>
            <p>This will appear on the {subjectName} leaderboard.</p>
            <input
              id="nicknameInput"
              className="nickname-input"
              maxLength={20}
              placeholder="e.g. Scholar01"
              autoFocus
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleStartQuiz();
              }}
            />
            <button className="continue-btn" onClick={handleStartQuiz}>
              Start Quiz <i className="fas fa-arrow-right" style={{ marginLeft: 6 }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default WhatsAppGate;
