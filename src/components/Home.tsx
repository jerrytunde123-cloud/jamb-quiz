"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/lib/use-local-storage";
import { getSubjectIcon } from "@/lib/subjects";
import { useRecentSlugs, addRecentSubject, MAX_RECENTS } from "@/lib/recents";
import { getStreakInfo } from "@/lib/streak";
import { useMounted } from "@/lib/use-mounted";

export interface SubjectRow {
  slug: string;
  name: string;
  count: number;
  compulsory?: boolean;
  icon?: string;
}

const CHANNELS = [
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

const OPTIONAL_CHANNEL = {
  label: "2027 JAMBITES",
  href: "https://whatsapp.com/channel/0029VbCwT4KAojYzRNFvpT1h",
};

/**
 * Mobile WhatsApp deep link interceptor.
 * Opens native WhatsApp app directly with fallback to browser URL.
 */
function handleWhatsAppDeepLink(
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

  const fallback = setTimeout(() => {
    window.location.href = httpsUrl;
  }, 1200);

  window.location.href = deepLink;
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) clearTimeout(fallback);
    },
    { once: true }
  );
}

export function Home({ subjects }: { subjects: SubjectRow[] }) {
  const mounted = useMounted();
  const router = useRouter();
  const [pendingSubject, setPendingSubject] = useState<SubjectRow | null>(null);
  const [step, setStep] = useState<"gate" | "nickname" | null>(null);
  const [challengeInfo] = useState<{
    challenger: string;
    score: string;
    subject: string;
    slug: string;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const challenger = params.get("challenger");
    const score = params.get("score");
    const subjectParam = params.get("subject");
    if (challenger && score && subjectParam) {
      return { challenger, score, subject: subjectParam, slug: subjectParam.toLowerCase() };
    }
    return null;
  });
  const [streak] = useState(() => getStreakInfo().streak);

  // Channels countdown state
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState<Record<string, number>>({});
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Nickname
  const [storedNickname, setStoredNickname] = useLocalStorage("nickname");
  const [nicknameInput, setNicknameInput] = useState("");

  // Recents & share
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [recentSlugs, , clearRecents] = useRecentSlugs();

  // Clear timers on unmount
  useEffect(() => {
    const t = timers.current;
    return () => {
      Object.values(t).forEach((iv) => clearInterval(iv));
    };
  }, []);

  // Listen for ?subject= in the URL (e.g. from shared /s/ links)
  useEffect(() => {
    if (typeof window === "undefined" || !subjects.length) return;
    const params = new URLSearchParams(window.location.search);
    const subjectParam = params.get("subject");

    if (subjectParam) {
      const match = subjects.find(
        (s) =>
          s.slug.toLowerCase() === subjectParam.toLowerCase() ||
          s.name.toLowerCase() === subjectParam.toLowerCase()
      );
      if (match) {
        const timeout = setTimeout(() => {
          openGate(match);
        }, 0);
        return () => clearTimeout(timeout);
      }
    }
  }, [subjects]);

  const recentSubjects = useMemo(() => {
    if (!mounted) return [];
    return recentSlugs
      .map((slug) => subjects.find((s) => s.slug === slug))
      .filter((s): s is SubjectRow => Boolean(s))
      .slice(0, MAX_RECENTS);
  }, [mounted, recentSlugs, subjects]);

  function openGate(subject: SubjectRow) {
    // Reset gate countdown timers and state
    Object.values(timers.current).forEach((iv) => clearInterval(iv));
    timers.current = {};
    setJoined({});
    setSecondsLeft({});
    setPendingSubject(subject);
    setStep("gate");
  }

  function handleChannelClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    chId: string,
    href: string
  ) {
    if (joined[chId] || timers.current[chId]) return;

    handleWhatsAppDeepLink(e, href);

    let sec = 5;
    setSecondsLeft((prev) => ({ ...prev, [chId]: sec }));

    const iv = setInterval(() => {
      sec--;
      if (sec <= 0) {
        clearInterval(iv);
        delete timers.current[chId];
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
    if (!allChannelsReady || !pendingSubject) return;
    setNicknameInput(storedNickname || "");
    setStep("nickname");
  }

  function handleStartQuiz() {
    if (!pendingSubject) return;
    const finalNick = nicknameInput.trim() || storedNickname || "Anonymous";
    setStoredNickname(finalNick);
    addRecentSubject(pendingSubject.slug);
    setStep(null);

    const query = new URLSearchParams();
    if (challengeInfo && challengeInfo.slug === pendingSubject.slug) {
      query.set("challenger", challengeInfo.challenger);
      query.set("score", challengeInfo.score);
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    router.push(`/quiz/${encodeURIComponent(pendingSubject.slug)}${qs}`);
  }

  async function share(slug: string) {
    const url = `${window.location.origin}/s/${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 1500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <>
      <section className="hero">
        <h2>PRACTICE 1000+ JAMB &amp; WAEC QUESTIONS</h2>
        <p>15 questions · 5 minutes · Randomised every attempt</p>
        {mounted && streak > 0 ? (
          <div>
            <span className="streak-pill">
              🔥 {streak}-Day Practice Streak!
            </span>
          </div>
        ) : null}
      </section>

      <main className="container">
        {mounted && challengeInfo ? (
          <div className="challenge-banner">
            <div className="challenge-icon">⚔️</div>
            <div>
              <div className="challenge-title">
                <strong>{challengeInfo.challenger}</strong> challenged you to beat{" "}
                <strong>{challengeInfo.score}/15</strong> in {challengeInfo.subject}!
              </div>
              <div className="challenge-sub">
                Can you step up and take the #1 spot? Click below to start!
              </div>
            </div>
          </div>
        ) : null}

        {recentSubjects.length > 0 && (
          <section className="recents-section">
            <div className="section-head-row">
              <h3 className="section-title">
                <i
                  className="fas fa-clock-rotate-left"
                  style={{ marginRight: 8, color: "var(--primary)" }}
                />
                Recently Practiced
              </h3>
              <button
                type="button"
                className="clear-recents-btn"
                onClick={clearRecents}
                title="Clear recent subjects"
              >
                <i className="fas fa-times" style={{ marginRight: 4 }} /> Clear
              </button>
            </div>
            <div className="grid recents-grid">
              {recentSubjects.map((s) => (
                <SubjectCard
                  key={`recent-${s.slug}`}
                  subject={s}
                  onShare={share}
                  onSelect={openGate}
                  copied={copiedSlug === s.slug}
                  mounted={mounted}
                />
              ))}
            </div>
          </section>
        )}

        <section className="all-subjects-section">
          <h3 className="section-title">
            {recentSubjects.length > 0 ? (
              <>
                <i
                  className="fas fa-layer-group"
                  style={{ marginRight: 8, color: "var(--primary)" }}
                />
                All Subjects
              </>
            ) : (
              "Pick a Subject"
            )}
          </h3>
          <div className="grid">
            {subjects.map((s) => (
              <SubjectCard
                key={s.slug}
                subject={s}
                onShare={share}
                onSelect={openGate}
                copied={copiedSlug === s.slug}
                mounted={mounted}
              />
            ))}
          </div>
        </section>

        {/* JAMB EXAM ASSISTANCE PANEL */}
        <section className="assistance-panel">
          <div className="assist-header">
            <i className="fas fa-graduation-cap" />
            <h3>FOR FULL EXAM GUIDE, PREPARATIONS &amp; ASSISTANCE</h3>
          </div>
          <div className="assist-buttons">
            <a
              className="assist-btn wa"
              href="https://wa.me/2349114187843?text=Hi%2C%20I%20need%20JAMB%20assistance"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-whatsapp" /> Chat on WhatsApp
            </a>
            <a
              className="assist-btn tg"
              href="https://t.me/Officialkingjay1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-telegram" /> Chat on Telegram
            </a>
            <a
              className="assist-btn site"
              href="https://utmelab.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fas fa-globe" /> Visit utmelab.com
            </a>
            <a
              className="assist-btn site-alt"
              href="https://jamb-lab.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fas fa-laptop" /> JAMB Practice (Vercel)
            </a>
          </div>
        </section>
      </main>

      {/* WHATSAPP 2-CHANNEL GATE MODAL */}
      {step === "gate" && pendingSubject && (
        <div className="gate" id="gate" onClick={() => setStep(null)}>
          <div className="gate-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="close-x"
              onClick={() => setStep(null)}
              title="Close modal"
            >
              ✕
            </button>
            <div className="gate-icon">
              <i className="fab fa-whatsapp" style={{ color: "#25d366" }} />
            </div>
            <h3>Join Both Channels to Unlock</h3>
            {challengeInfo && challengeInfo.slug === pendingSubject.slug ? (
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
                starting the <strong>{pendingSubject.name}</strong> quiz.
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
              <i className={`fas ${allChannelsReady ? "fa-unlock" : "fa-lock"}`} style={{ marginRight: 6 }} />
              Continue to Quiz
            </button>

            <p className="small" style={{ marginTop: 14 }}>
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
      )}

      {/* NICKNAME PROMPT MODAL */}
      {step === "nickname" && pendingSubject && (
        <div className="gate" id="nicknameModal" onClick={() => setStep(null)}>
          <div className="gate-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="close-x"
              onClick={() => setStep(null)}
              title="Close modal"
            >
              ✕
            </button>
            <h3>Enter Your Nickname</h3>
            <p>This will appear on the {pendingSubject.name} leaderboard.</p>
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

/* ===========================  subject card  =========================== */
function SubjectCard({
  subject,
  onShare,
  onSelect,
  copied,
  mounted = true,
}: {
  subject: SubjectRow;
  onShare: (slug: string) => void;
  onSelect: (subject: SubjectRow) => void;
  copied: boolean;
  mounted?: boolean;
}) {
  const [best] = useLocalStorage(`best_${subject.slug}`);
  const iconClass = subject.icon || getSubjectIcon(subject.slug);

  return (
    <div
      className="subject-card"
      style={{ cursor: "pointer" }}
      onClick={() => onSelect(subject)}
    >
      {mounted && best ? (
        <div className="best-badge">
          <i className="fas fa-trophy" /> {best}%
        </div>
      ) : null}
      <div className="icon">
        <i className={`fa-solid ${iconClass}`} />
      </div>
      <h4>{subject.name}</h4>
      <span className="badge">{subject.count} questions</span>
      <button
        type="button"
        className="share-btn"
        title="Copy share link"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onShare(subject.slug);
        }}
      >
        <i className={`fas ${copied ? "fa-check" : "fa-link"}`} />
      </button>
    </div>
  );
}

export default Home;
