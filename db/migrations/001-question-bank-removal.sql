-- ============================================================================
-- 001 · Question bank moves to the UTME Lab API
-- Run once on an existing database:  npm run db:migrate
-- Fresh databases only need `npm run db:push`.
-- ============================================================================

-- The app no longer mirrors the bank locally.
DROP INDEX IF EXISTS idx_questions_subject;
DROP TABLE IF EXISTS questions;

-- Sessions are ephemeral (30 minute TTL), so recreating the table is safe.
-- The old shape stored question ids to look answers up in `questions`; the
-- new shape keeps the answer key captured from the API at quiz start.
DROP INDEX IF EXISTS idx_sessions_subject;
DROP TABLE IF EXISTS sessions;

CREATE TABLE sessions (
  session_id   TEXT PRIMARY KEY,
  subject      TEXT NOT NULL,
  subject_name TEXT NOT NULL DEFAULT '',
  answer_key   TEXT NOT NULL,
  used         INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_subject ON sessions(subject);
