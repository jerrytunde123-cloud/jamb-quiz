"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { PublicPassage, PublicQuestion, SubmitResult } from "@/lib/types";
import { useLocalStorage } from "@/lib/use-local-storage";
import { addRecentSubject } from "@/lib/recents";
import {
  playSelectSound,
  playTickSound,
  playCelebrationSound,
  playFinishSound,
  isSoundEnabled,
  setSoundEnabled,
} from "@/lib/sounds";
import { fireConfetti } from "@/lib/confetti";
import { getHypeResult } from "@/lib/hype";
import { recordPracticeDay, getStreakInfo } from "@/lib/streak";
import { useMounted } from "@/lib/use-mounted";
import { RichText } from "./RichText";
import { Comments } from "./Comments";
import { WhatsAppGate } from "./WhatsAppGate";

/** The bank serves four-option rows and a few five-option cloze questions. */
const LETTERS = ["A", "B", "C", "D", "E", "F"];

type Phase = "idle" | "loading" | "quiz" | "submitting" | "done" | "error";

interface Props {
  /** Subject slug, used in the quiz and leaderboard URLs. */
  slug: string;
  /** Display name. */
  name: string;
  /** Optional challenger nickname from share link. */
  challenger?: string;
  /** Optional challenger score to beat. */
  challengeScore?: string;
  /** Whether to auto-start immediately (e.g. redirected from home gate). */
  autoStart?: boolean;
}

/**
 * The interactive quiz.
 *
 * The server hands us questions WITHOUT their answers; grading happens
 * server-side on submit, and the result comes back with the answer key for
 * the review screen.
 */
export function Quiz({ slug, name, challenger, challengeScore, autoStart }: Props) {
  const mounted = useMounted();
  const [phase, setPhase] = useState<Phase>(() => (autoStart ? "loading" : "idle"));
  const [isGateOpen, setIsGateOpen] = useState(() => !autoStart);
  const [error, setError] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [passages, setPassages] = useState<Record<string, PublicPassage>>({});
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(300);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [resultTab, setResultTab] = useState<"review" | "leaderboard" | "comments">("review");
  const [bestInfo, setBestInfo] = useState<{ isNew: boolean; prev: number } | null>(null);
  const [nickname] = useLocalStorage("nickname");
  const [startedAt, setStartedAt] = useState(0);

  // Engagement states
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [animatedScore, setAnimatedScore] = useState(0);
  const [streakCount, setStreakCount] = useState(() => getStreakInfo().streak);

  const submitted = useRef(false);
  /** Latest answers, so the auto-submit timer never grades a stale snapshot. */
  const answersRef = useRef<Record<string, number>>({});
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (slug) addRecentSubject(slug);
  }, [slug]);

  const start = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setResultTab("review");
    setBestInfo(null);
    try {
      const res = await fetch(`/api/quiz/${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Could not start the quiz.");
      }
      const data = await res.json();
      setQuizId(data.quizId);
      setQuestions(data.questions);
      setPassages(data.passages ?? {});
      setRemaining(data.duration ?? 300);
      setAnswers({});
      answersRef.current = {};
      setIndex(0);
      setStartedAt(Date.now());
      setPhase("quiz");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the quiz.");
      setPhase("error");
    }
  }, [slug]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;

    const sessionKey = "gate_unlocked_" + slug;
    let isUnlocked = false;
    if (typeof window !== "undefined") {
      try {
        isUnlocked = sessionStorage.getItem(sessionKey) === "1";
        if (isUnlocked) {
          sessionStorage.removeItem(sessionKey);
        }
      } catch {
        /* ignore storage exceptions */
      }
    }

    if (autoStart && isUnlocked) {
      const timer = setTimeout(() => {
        void start();
      }, 0);
      return () => clearTimeout(timer);
    } else if (autoStart && !isUnlocked) {
      // User refreshed or opened a ?start=1 link without completing the gate in this session
      const timer = setTimeout(() => {
        setIsGateOpen(true);
        setPhase("idle");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [autoStart, slug, start]);

  const submit = useCallback(
    async (answersToSend: Record<string, number>) => {
      if (!quizId || submitted.current) return;
      submitted.current = true;
      setPhase("submitting");
      try {
        const finalNick =
          (typeof window !== "undefined" ? localStorage.getItem("nickname") : "") ||
          nickname ||
          "Anonymous";
        const res = await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            quizId,
            answers: answersToSend,
            nickname: finalNick,
            timeTaken: Math.round((Date.now() - startedAt) / 1000),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data?.error === "This quiz has already been submitted" && result) {
            setPhase("done");
            return;
          }
          throw new Error(data?.error ?? "Could not submit your answers. Please check your connection.");
        }
        if (data && typeof data.score === "number" && typeof data.total === "number" && data.total > 0) {
          const newStreak = recordPracticeDay();
          setStreakCount(newStreak);

          const pct = Math.round((data.score / data.total) * 100);
          const prevBest = Number(localStorage.getItem(`best_${slug}`) || 0);
          const isNewBest = pct > prevBest;
          if (isNewBest) {
            setBestInfo({ isNew: true, prev: prevBest });
            localStorage.setItem(`best_${slug}`, String(pct));
            localStorage.setItem(`best_${name}`, String(pct));
          } else {
            setBestInfo({ isNew: false, prev: prevBest });
          }

          if (pct >= 70 || isNewBest) {
            fireConfetti();
            playCelebrationSound();
          } else {
            playFinishSound();
          }
        }
        setResult(data as SubmitResult);
        setPhase("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not submit your answers.");
        setPhase("error");
        submitted.current = false;
      }
    },
    [quizId, nickname, startedAt, slug, name, result]
  );

  // Countdown timer. Auto-submits when it reaches zero.
  useEffect(() => {
    if (phase !== "quiz") return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 10 && next > 0) {
          playTickSound();
        }
        if (next <= 0) {
          window.clearInterval(id);
          void submit(answersRef.current);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // The latest answers are read from a ref, so the timer is not restarted
    // on every answer change.
  }, [phase, submit]);

  // Animated score counter on result screen
  useEffect(() => {
    if (phase !== "done" || !result || result.score <= 0) return;
    let count = 0;
    const target = result.score;
    const interval = Math.max(30, Math.floor(650 / target));
    const timer = setInterval(() => {
      count++;
      setAnimatedScore(count);
      if (count >= target) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [phase, result]);

  const answeredCount = Object.keys(answers).length;
  const current = questions[index];
  const progress = questions.length ? (answeredCount / questions.length) * 100 : 0;

  const timeLabel = useMemo(() => {
    const m = Math.floor(Math.max(0, remaining) / 60);
    const s = Math.max(0, remaining) % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  function choose(optionIndex: number) {
    if (!current) return;
    playSelectSound();
    setAnswers((prev) => {
      const next = { ...prev, [current.id]: optionIndex };
      answersRef.current = next;
      return next;
    });
  }

  if (phase === "idle") {
    return (
      <>
        <WhatsAppGate
          isOpen={isGateOpen}
          subjectName={name}
          subjectSlug={slug}
          challengeInfo={
            challenger && challengeScore
              ? { challenger, score: challengeScore }
              : null
          }
          onClose={() => setIsGateOpen(false)}
          onUnlocked={() => {
            setIsGateOpen(false);
            void start();
          }}
        />

        <section className="quiz-start">
          {challenger && challengeScore && (
            <div className="challenge-banner" style={{ margin: "0 auto 18px", textAlign: "left" }}>
              <div className="challenge-icon">⚔️</div>
              <div>
                <div className="challenge-title">
                  Challenge from <strong>{challenger}</strong>!
                </div>
                <div className="challenge-sub">
                  Beat <strong>{challengeScore}/15</strong> to take the crown in {name}!
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <button
              type="button"
              className="sound-toggle-btn"
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                setSoundEnabled(next);
              }}
              title="Toggle sound effects"
            >
              {soundOn ? "🔊 Sound On" : "🔇 Sound Off"}
            </button>
            {mounted && streakCount > 0 && (
              <span className="streak-pill" style={{ margin: 0 }}>
                🔥 {streakCount}-Day Streak
              </span>
            )}
          </div>

          <h2 className="section-title">{name}</h2>
          <p className="muted">
            15 questions · 5 minutes · randomised every attempt. Your answers are
            graded on the server.
          </p>
          <button className="btn-primary" onClick={() => setIsGateOpen(true)}>
            <i className="fas fa-play" /> Start quiz
          </button>
          {!nickname.trim() && (
            <p className="muted small">
              No nickname set — you will appear as &quot;Anonymous&quot; on the
              leaderboard.
            </p>
          )}
          <p className="muted small">
            <Link href="/">← Choose another subject</Link>
          </p>
        </section>
      </>
    );
  }

  if (phase === "loading") {
    return <p className="muted">Loading questions…</p>;
  }

  if (phase === "error") {
    return (
      <section className="quiz-start">
        <p className="error-text">{error}</p>
        <button className="btn-primary" onClick={() => { submitted.current = false; void start(); }}>
          Try again
        </button>
        <p className="muted small">
          <Link href="/">← Back to subjects</Link>
        </p>
      </section>
    );
  }

  if (phase === "done" && result) {
    const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
    const hype = getHypeResult(result.score, result.total, result.timeTaken);
    const challengerNick = (nickname || "").trim() || "A Challenger";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/s/${slug}?challenger=${encodeURIComponent(challengerNick)}&score=${result.score}`;
    const shareText = `${hype.emoji} I just scored ${result.score}/${result.total} ('${hype.badge}') in JAMB ${name} on UTME LAB! Can you beat my score? 🔥\n\nTake the challenge here 👉 ${shareUrl}`;

    return (
      <section className="quiz-result">
        <div className="hype-card" style={{ borderColor: hype.color }}>
          <div className="hype-badge" style={{ background: hype.color, color: "#000" }}>
            {hype.emoji} {hype.badge}
          </div>
          <div className="hype-tagline">{hype.tagline}</div>
          <p className="result-score" style={{ margin: "10px 0 6px" }}>
            <span className="score-count-up">{animatedScore}</span>/{result.total}
          </p>
          <p className="muted small">
            {pct}% accuracy · {result.subject} · {formatTime(result.timeTaken)}
          </p>
          <p className="hype-quote">&ldquo;{hype.quote}&rdquo;</p>

          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
            {hype.speedText && (
              <span className="speed-badge">{hype.speedText}</span>
            )}
            {streakCount > 0 && (
              <span className="speed-badge" style={{ borderColor: "#ff6b35", color: "#ff6b35" }}>
                🔥 {streakCount}-Day Streak
              </span>
            )}
            {bestInfo?.isNew && (
              <span className="speed-badge" style={{ borderColor: "var(--success)", color: "var(--success)" }}>
                🏆 New Personal Best!
              </span>
            )}
          </div>
        </div>

        <div className="share-score-box">
          <p className="share-score-lead">Challenge your study group &amp; friends</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <a
              className="btn-wa"
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ margin: 0, flex: "1 1 200px", maxWidth: 260 }}
            >
              <i className="fab fa-whatsapp" /> Share on WhatsApp
            </a>
            <a
              className="btn-wa"
              href={`https://t.me/share/url?url=${encodeURIComponent(
                shareUrl
              )}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                margin: 0,
                background: "#229ed9",
                color: "#fff",
                borderColor: "transparent",
                flex: "1 1 200px",
                maxWidth: 260,
              }}
            >
              <i className="fab fa-telegram" /> Share on Telegram
            </a>
          </div>
        </div>

        <div className="tabs-mini">
          <button
            className={resultTab === "review" ? "active" : ""}
            type="button"
            onClick={() => setResultTab("review")}
          >
            Review Answers ({result.score}/{result.total})
          </button>
          <button
            className={resultTab === "leaderboard" ? "active" : ""}
            type="button"
            onClick={() => setResultTab("leaderboard")}
          >
            🏆 Leaderboard
          </button>
          <button
            className={resultTab === "comments" ? "active" : ""}
            type="button"
            onClick={() => setResultTab("comments")}
          >
            💬 Comments
          </button>
        </div>

        {resultTab === "review" && (
          <div className="review-list">
            {questions.map((q, i) => {
              const correct = result.answers[q.id];
              const picked = result.chosen[q.id];
              const isRight = picked === correct;
              return (
                <div key={q.id} className={`review-item ${isRight ? "correct" : "wrong"}`}>
                  {q.passageId && passages[q.passageId] && (
                    <Passage passage={passages[q.passageId]} />
                  )}
                  <p className="review-q">
                    <strong>{i + 1}.</strong>{" "}
                    <RichText text={q.question} marks={q.inline} />
                  </p>
                  <ul className="review-options">
                    {q.options.map((opt, oi) => {
                      const state =
                        oi === correct ? " correct" : oi === picked ? " wrong" : "";
                      return (
                        <li key={oi} className={`review-option${state}`}>
                          <span className="letter">{LETTERS[oi]}</span>{" "}
                          <RichText text={opt} marks={q.optionInline[oi]} />
                          {oi === correct && <span className="tag ok">correct</span>}
                          {oi === picked && oi !== correct && (
                            <span className="tag no">your answer</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {resultTab === "leaderboard" && (
          <MiniLeaderboard slug={slug} />
        )}

        {resultTab === "comments" && (
          <div style={{ marginTop: 14 }}>
            <Comments subject={slug} />
          </div>
        )}

        <div className="actions-row">
          <button className="btn-primary" onClick={() => { submitted.current = false; void start(); }}>
            Try another set
          </button>
          <Link className="btn-secondary" href="/">Back to subjects</Link>
        </div>
      </section>
    );
  }

  if (phase === "submitting") {
    return (
      <section className="quiz-start">
        <div className="gate-icon" style={{ fontSize: 36, marginBottom: 16 }}>
          <i className="fas fa-circle-notch fa-spin" style={{ color: "var(--primary)" }} />
        </div>
        <h3>Grading your answers…</h3>
        <p className="muted small" style={{ marginTop: 6 }}>
          Calculating your score and ranking…
        </p>
      </section>
    );
  }

  if (!current) return <p className="muted">No questions available for {name}.</p>;

  return (
    <section className="quiz-body">
      <div className="quiz-head">
        <span className="progress-text">
          Question {index + 1} / {questions.length}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="sound-toggle-btn"
            style={{ padding: "4px 8px", fontSize: 11 }}
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
            }}
            title="Toggle sound"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <span
            className={`timer ${remaining <= 10 ? "danger pulse" : remaining <= 60 ? "warn" : ""}`}
            aria-live="polite"
            aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`}
          >
            <i className="fas fa-clock" /> {timeLabel}
          </span>
        </div>
      </div>

      {challenger && challengeScore && (
        <div
          style={{
            background: "rgba(245, 166, 35, 0.08)",
            border: "1px solid rgba(245, 166, 35, 0.25)",
            borderRadius: 8,
            padding: "6px 12px",
            marginBottom: 12,
            fontSize: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            ⚔️ Challenger: <strong>{challenger}</strong>
          </span>
          <span style={{ color: "var(--primary)", fontWeight: 700 }}>
            Target: Beat {challengeScore}/15
          </span>
        </div>
      )}

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {questions.length > 1 && (
        <div className="cbt-palette" role="tablist" aria-label="Question palette">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== -1;
            const isCurrent = idx === index;
            return (
              <button
                key={q.id}
                type="button"
                className={`palette-num ${isCurrent ? "current" : ""} ${isAnswered ? "answered" : ""}`}
                onClick={() => setIndex(idx)}
                title={`Question ${idx + 1}${isAnswered ? " (Answered)" : " (Unanswered)"}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      )}

      <div className="question-card">
        {current.passageId && passages[current.passageId] && (
          <Passage passage={passages[current.passageId]} />
        )}
        <h3 className="question-text">
          <RichText text={current.question} marks={current.inline} />
        </h3>
        {current.year > 0 && (
          <p className="muted small">
            {current.exam} {current.year}
            {current.section ? ` · ${current.section}` : ""}
          </p>
        )}

        <div className="options">
          {current.options.map((opt, oi) => (
            <button
              key={oi}
              type="button"
              className={`option ${answers[current.id] === oi ? "selected" : ""}`}
              onClick={() => choose(oi)}
            >
              <span className="letter">{LETTERS[oi]}</span>
              <span>
                <RichText text={opt} marks={current.optionInline[oi]} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-nav">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          ← Previous
        </button>
        {index < questions.length - 1 ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={() => void submit(answersRef.current)}
            disabled={answeredCount === 0 || phase === "submitting"}
          >
            {phase === "submitting" ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />
                Submitting…
              </>
            ) : (
              `Submit (${answeredCount}/${questions.length})`
            )}
          </button>
        )}
      </div>
    </section>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

/**
 * The stimulus a comprehension or cloze question is read against.
 *
 * It sits above the stem because the stem refers back to it ("according to
 * the passage"), and it scrolls on its own: a passage is a page of text,
 * while the question is one line.
 */
function Passage({ passage }: { passage: PublicPassage }) {
  const heading = [passage.kind, passage.title].filter(Boolean).join(" — ");
  return (
    <div className="passage-block">
      {heading && <p className="passage-head">{heading}</p>}
      {passage.author && <p className="passage-author">{passage.author}</p>}
      <div className="passage-text">
        <RichText text={passage.text} marks={passage.inline} />
      </div>
    </div>
  );
}

/**
 * Compact in-result leaderboard.
 * Allows students to instantly see where they rank among their peers
 * without leaving the review screen.
 */
function MiniLeaderboard({ slug }: { slug: string }) {
  const [rows, setRows] = useState<Array<{
    id: number;
    nickname: string;
    score: number;
    total: number;
    time_taken: number;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [storedNickname] = useLocalStorage("nickname");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch(`/api/leaderboard/${encodeURIComponent(slug)}`);
        if (res.ok && active) {
          setRows(await res.json());
        }
      } catch {
        // ignore network error
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <p className="muted" style={{ padding: "24px 0", textAlign: "center" }}>
        Loading leaderboard…
      </p>
    );
  }

  if (!rows.length) {
    return (
      <p className="muted" style={{ padding: "24px 0", textAlign: "center" }}>
        No attempts recorded yet. Be the first on the leaderboard!
      </p>
    );
  }

  return (
    <div className="mini-lb-wrap" style={{ margin: "14px 0" }}>
      <div className="lb-list">
        {rows.slice(0, 15).map((r, i) => {
          const isMe = Boolean(
            storedNickname &&
              r.nickname.toLowerCase() === storedNickname.toLowerCase()
          );
          return (
            <div className={`lb-row ${isMe ? "lb-row-me" : ""}`} key={r.id}>
              <div className="lb-line">
                <span className="lb-rank">#{i + 1}</span>
                <span className="lb-name">
                  {r.nickname}
                  {isMe && <span className="me-badge">You</span>}
                </span>
                <span className="lb-score">
                  {r.score}/{r.total}
                </span>
              </div>
              <span className="muted small">
                {Math.floor(r.time_taken / 60)}m {r.time_taken % 60}s · {r.created_at}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <Link
          className="tab-link"
          href={`/leaderboard/${encodeURIComponent(slug)}`}
          style={{ display: "inline-block" }}
        >
          View Full Leaderboard &amp; Rankings →
        </Link>
      </div>
    </div>
  );
}
