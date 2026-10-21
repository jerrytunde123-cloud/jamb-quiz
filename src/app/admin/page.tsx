import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminStats, getSubjects } from "@/lib/quiz";
import { getSubjectIcon } from "@/lib/subjects";
import { isValidAdminKey } from "@/lib/auth";
import { AdminShareLinks } from "@/components/AdminShareLinks";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin Dashboard · JAMB Quiz" };

interface Props {
  searchParams: Promise<{ error?: string }>;
}

/** Action to authenticate admin using the secret key from .env */
async function unlockAdmin(formData: FormData) {
  "use server";
  const key = String(formData.get("adminKey") || "").trim();

  if (isValidAdminKey(key)) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", key, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    redirect("/admin");
  } else {
    redirect("/admin?error=invalid");
  }
}

/** Action to lock the panel */
async function lockAdmin() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin");
}

export default async function AdminPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const cookieStore = await cookies();
  const sessionKey = cookieStore.get("admin_session")?.value;
  const isAuthed = isValidAdminKey(sessionKey);

  if (!isAuthed) {
    return (
      <main className="gate">
        <div className="gate-card">
          <div className="gate-icon">
            <i className="fas fa-lock" style={{ color: "var(--primary)" }} />
          </div>
          <h3>Admin Access</h3>
          <p>Enter your secret admin key to view operations &amp; statistics</p>

          <form action={unlockAdmin} className="auth-form" style={{ marginTop: 12 }}>
            <input
              type="password"
              name="adminKey"
              placeholder="Admin secret key"
              required
              autoFocus
              autoComplete="off"
              className="nickname-input"
            />
            {error === "invalid" && (
              <p className="error-text small" style={{ margin: "4px 0 8px" }}>
                Incorrect admin key. Please try again.
              </p>
            )}
            <button className="continue-btn" type="submit">
              Unlock Panel
            </button>
          </form>

          <p className="muted small" style={{ marginTop: 16 }}>
            <Link href="/">← Back to Home</Link>
          </p>
        </div>
      </main>
    );
  }

  const [subjects, stats] = await Promise.all([getSubjects(), getAdminStats()]);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <Image src="/logo.png" alt="Success Academy Logo" width={42} height={42} className="logo-img" priority />
          <div>
            <h1>SUCCESS ACADEMY</h1>
            <span>UTME LAB · Admin Dashboard</span>
          </div>
        </div>
        <nav className="socials">
          <Link className="contact-link" href="/">
            <i className="fas fa-arrow-left" /> Home
          </Link>
          <form action={lockAdmin} style={{ display: "inline" }}>
            <button
              type="submit"
              className="contact-link"
              style={{ cursor: "pointer", background: "none" }}
              title="Lock panel and sign out"
            >
              <i className="fas fa-lock" /> Lock Panel
            </button>
          </form>
        </nav>
      </header>

      <main className="container">
        <h3 className="section-title">Admin Dashboard</h3>

        {stats && (
          <div
            className="admin-stats-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
              marginBottom: 28,
            }}
          >
            <div
              className="stat-card"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 18,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)" }}>
                {stats.totalAttempts}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Total Attempts
              </div>
            </div>
            <div
              className="stat-card"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 18,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)" }}>
                {subjects.length}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Live Subjects
              </div>
            </div>
            <div
              className="stat-card"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 18,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)" }}>
                {stats.totalLikes}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Total Likes
              </div>
            </div>
            <div
              className="stat-card"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 18,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)" }}>
                {stats.totalComments}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Comments Posted
              </div>
            </div>
            <div
              className="stat-card"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 18,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)" }}>
                {stats.cacheEntries}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Cached Pools in DB
              </div>
            </div>
          </div>
        )}

        {stats && stats.subjectAttempts.length > 0 && (
          <section style={{ marginBottom: 30 }}>
            <h4 style={{ fontSize: 15, marginBottom: 12, color: "var(--text)" }}>
              Most Practiced Subjects
            </h4>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                      textAlign: "left",
                      color: "var(--muted)",
                    }}
                  >
                    <th style={{ padding: "10px 14px" }}>Subject</th>
                    <th style={{ padding: "10px 14px" }}>Attempts</th>
                    <th style={{ padding: "10px 14px" }}>Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.subjectAttempts.map((row) => (
                    <tr key={row.subject} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                        {row.subject}
                      </td>
                      <td style={{ padding: "10px 14px" }}>{row.count}</td>
                      <td style={{ padding: "10px 14px" }}>{row.avg_score} / 15</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <AdminShareLinks subjects={subjects} />

        <h4 style={{ fontSize: 15, margin: "32px 0 12px", color: "var(--text)" }}>
          Subject Catalog
        </h4>
        <div className="grid">
          {subjects.map((s) => (
            <div className="subject-card" key={s.slug}>
              <div className="icon">
                <i className={`fa-solid ${s.icon || getSubjectIcon(s.slug)}`} />
              </div>
              <h4>{s.name}</h4>
              <span className="badge">{s.count} questions</span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
