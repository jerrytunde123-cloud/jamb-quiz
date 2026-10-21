"use client";

import { useCallback, useEffect, useState } from "react";
import type { Comment } from "@/lib/types";
import { useLocalStorage } from "@/lib/use-local-storage";

/** Comment wall for a subject. */
export function Comments({ subject }: { subject: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [storedName] = useLocalStorage("nickname");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/comments/${encodeURIComponent(subject)}`,
        { cache: "no-store" }
      );
      if (res.ok) setComments((await res.json()) as Comment[]);
    } catch {
      /* ignore network hiccups on the comment wall */
    } finally {
      setLoaded(true);
    }
  }, [subject]);

  useEffect(() => {
    // The fetch is started in the effect; the state update happens in the
    // async callback, which is not a synchronous setState in the effect body.
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/comments/${encodeURIComponent(subject)}`,
          { cache: "no-store" }
        );
        if (!cancelled && res.ok) setComments((await res.json()) as Comment[]);
      } catch {
        /* ignore network hiccups on the comment wall */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subject]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject, name, message }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "Could not post the comment.");
      setMessage("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post the comment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="comments">
      <h3 className="section-title">Comments</h3>

      <form className="comment-form" onSubmit={submit}>
        <input
          className="comment-name"
          placeholder="Your name"
          maxLength={40}
          value={name || storedName}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="comment-message"
          placeholder="Share a tip or ask a question…"
          maxLength={400}
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={busy || !message.trim()}>
          {busy ? "Posting…" : "Post comment"}
        </button>
        {error && <p className="error-text small">{error}</p>}
      </form>

      {loaded && comments.length === 0 ? (
        <p className="muted small">No comments yet.</p>
      ) : (
        <div className="comment-list">
          {comments.map((c) => (
            <div className="comment-item" key={c.id}>
              <div className="comment-head">
                <strong>{c.name}</strong>
                <span className="muted small">{c.created_at}</span>
              </div>
              <p>{c.message}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
