"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/lib/use-local-storage";
import { getSubjectIcon } from "@/lib/subjects";
import { useRecentSlugs, addRecentSubject, MAX_RECENTS } from "@/lib/recents";
import { getStreakInfo } from "@/lib/streak";
import { useMounted } from "@/lib/use-mounted";
import { WhatsAppGate } from "./WhatsAppGate";

export interface SubjectRow {
  slug: string;
  name: string;
  count: number;
  compulsory?: boolean;
  icon?: string;
}

export function Home({ subjects }: { subjects: SubjectRow[] }) {
  const mounted = useMounted();
  const router = useRouter();
  const [pendingSubject, setPendingSubject] = useState<SubjectRow | null>(null);
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

  // Recents & share
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [recentSlugs, , clearRecents] = useRecentSlugs();

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
    setPendingSubject(subject);
  }

  function handleUnlocked() {
    if (!pendingSubject) return;
    const targetSlug = pendingSubject.slug;
    addRecentSubject(targetSlug);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("gate_unlocked_" + targetSlug, "1");
      } catch {
        /* ignore private mode storage errors */
      }
    }
    const query = new URLSearchParams();
    query.set("start", "1");
    if (challengeInfo && challengeInfo.slug === targetSlug) {
      query.set("challenger", challengeInfo.challenger);
      query.set("score", challengeInfo.score);
    }
    setPendingSubject(null);
    router.push(`/quiz/${encodeURIComponent(targetSlug)}?${query.toString()}`);
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
          <div className="assist-content">
            <div className="assist-eyebrow">
              <i className="fas fa-graduation-cap" /> SUCCESS ACADEMY · UTME LAB
            </div>
            <h3 className="assist-title">Need the full exam guide &amp; preparation help?</h3>
            <p className="assist-desc">
              Go beyond practice quizzes — get complete JAMB/Past-question prep, study
              materials, CBT simulation and 1-on-1 assistance from our team.
            </p>
            <div className="assist-chips">
              <span><i className="fas fa-book-open" /> Study materials</span>
              <span><i className="fas fa-laptop-code" /> Full CBT simulator</span>
              <span><i className="fas fa-headset" /> 1-on-1 assistance</span>
              <span><i className="fas fa-chart-line" /> Exam guide</span>
            </div>
            <div className="assist-buttons">
              <a
                className="assist-btn site"
                href="https://utmelab.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fas fa-globe" /> Visit utmelab.com
              </a>
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
                className="assist-btn site-alt"
                href="https://jamb-lab.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fas fa-laptop" /> JAMB Practice (Vercel)
              </a>
            </div>
          </div>
        </section>
      </main>

      {pendingSubject && (
        <WhatsAppGate
          isOpen={Boolean(pendingSubject)}
          subjectName={pendingSubject.name}
          subjectSlug={pendingSubject.slug}
          challengeInfo={
            challengeInfo && challengeInfo.slug === pendingSubject.slug
              ? { challenger: challengeInfo.challenger, score: challengeInfo.score }
              : null
          }
          onClose={() => setPendingSubject(null)}
          onUnlocked={handleUnlocked}
        />
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
      onTouchStart={() => {}} // Enable touch events on mobile
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
