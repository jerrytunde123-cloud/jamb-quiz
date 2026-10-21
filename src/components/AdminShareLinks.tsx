"use client";

import { useMemo, useState } from "react";
import type { SubjectSummary } from "@/lib/types";
import { getSubjectIcon } from "@/lib/subjects";

export function AdminShareLinks({ subjects }: { subjects: SubjectSummary[] }) {
  const [filter, setFilter] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
    );
  }, [subjects, filter]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function handleCopy(slug: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 1800);
    } catch {
      window.prompt("Copy link:", url);
    }
  }

  return (
    <section style={{ marginTop: 32 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h3 className="section-title" style={{ margin: 0 }}>
            <i
              className="fas fa-share-nodes"
              style={{ marginRight: 8, color: "var(--primary)" }}
            />
            WhatsApp &amp; Telegram Share Links
          </h3>
          <p className="muted small" style={{ marginTop: 4 }}>
            Click copy or blast any subject link directly to WhatsApp/Telegram groups.
          </p>
        </div>
        <div style={{ minWidth: 220, flex: "1 1 240px", maxWidth: 360 }}>
          <input
            type="text"
            placeholder="Filter subjects…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="nickname-input"
            style={{
              margin: 0,
              textAlign: "left",
              padding: "10px 14px",
              fontSize: 13,
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((s) => {
          const url = `${origin}/s/${s.slug}`;
          const isCopied = copiedSlug === s.slug;
          const shareText = `🔥 Practice JAMB ${s.name} Past Questions (15 Questions · 5 Mins) free on UTME LAB!\n\nTake the challenge here 👉 ${url}`;

          return (
            <div
              key={s.slug}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "12px 16px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minWidth: 200,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--primary-gradient)",
                    color: "#000",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  <i className={`fa-solid ${s.icon || getSubjectIcon(s.slug)}`} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      wordBreak: "break-all",
                    }}
                  >
                    {url}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleCopy(s.slug, url)}
                  className="btn-secondary"
                  style={{ fontSize: 12, padding: "8px 14px" }}
                  title="Copy viral link to clipboard"
                >
                  <i
                    className={`fas ${isCopied ? "fa-check" : "fa-copy"}`}
                    style={{
                      marginRight: 6,
                      color: isCopied ? "var(--success)" : "inherit",
                    }}
                  />
                  {isCopied ? "Copied!" : "Copy Link"}
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-wa"
                  style={{
                    width: "auto",
                    margin: 0,
                    padding: "8px 14px",
                    fontSize: 12,
                  }}
                  title="Share to WhatsApp"
                >
                  <i className="fab fa-whatsapp" style={{ marginRight: 6 }} /> WhatsApp
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(
                    url
                  )}&text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{
                    fontSize: 12,
                    padding: "8px 14px",
                    background: "#229ed9",
                    color: "#fff",
                    borderColor: "transparent",
                  }}
                  title="Share to Telegram"
                >
                  <i className="fab fa-telegram" style={{ marginRight: 6 }} /> Telegram
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
export default AdminShareLinks;
