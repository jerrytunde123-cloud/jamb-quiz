import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeaderboard, resolveSubject } from "@/lib/quiz";
import { getSubjectIcon } from "@/lib/subjects";
import { Comments } from "@/components/Comments";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>;
}): Promise<Metadata> {
  const { subject: slug } = await params;
  const subject = await resolveSubject(slug);
  return { title: subject ? `${subject.name} Leaderboard` : "Leaderboard" };
}

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: slug } = await params;
  const subject = await resolveSubject(slug);
  if (!subject) notFound();

  const rows = await getLeaderboard(subject.slug);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <Image src="/logo.png" alt="Success Academy Logo" width={42} height={42} className="logo-img" priority />
          <div>
            <h1>SUCCESS ACADEMY</h1>
            <span>UTME LAB · JAMB/WAEC Practice</span>
          </div>
        </div>
        <nav className="socials">
          <Link className="contact-link" href="/">
            <i className="fas fa-arrow-left" /> Subjects
          </Link>
        </nav>
      </header>

      <main className="container">
        <h3 className="section-title">
          <i className={`fa-solid ${subject.icon || getSubjectIcon(subject.slug)}`} style={{ marginRight: 8, color: "var(--primary)" }} />
          {subject.name} — Leaderboard
        </h3>

        {rows.length === 0 ? (
          <p className="muted">No attempts recorded yet. Be the first!</p>
        ) : (
          <div className="lb-list">
            {rows.map((r, i) => (
              <div className="lb-row" key={r.id}>
                <div className="lb-line">
                  <span className="lb-rank">#{i + 1}</span>
                  <span className="lb-name">{r.nickname}</span>
                  <span className="lb-score">
                    {r.score}/{r.total}
                  </span>
                </div>
                <span className="muted small">
                  {formatTime(r.time_taken)} · {r.created_at}
                </span>
              </div>
            ))}
          </div>
        )}

        <Comments subject={subject.slug} />
      </main>
    </>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
