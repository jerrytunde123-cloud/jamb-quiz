-- ============================================================================
-- JAMB Quiz · Turso schema
-- Run with:  npm run db:push
--
-- Questions are NOT stored here. They come from the UTME Lab question API
-- (src/lib/utmelab.ts) when an attempt starts; only quiz sessions, graded
-- attempts, likes and comments live in this database.
-- ============================================================================

-- In-flight quiz sessions (server-side, so answers can never be forged) -----
-- `answer_key` is captured from the API at quiz start as
-- { "answers": { questionId: index }, "optionCounts": { questionId: n } }
-- and never leaves the server. `subject` is the API slug, `subject_name` its
-- display label.
CREATE TABLE IF NOT EXISTS sessions (
  session_id   TEXT PRIMARY KEY,
  subject      TEXT NOT NULL,
  subject_name TEXT NOT NULL DEFAULT '',
  answer_key   TEXT NOT NULL,
  used         INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON sessions(subject);

-- Graded attempts -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS attempts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  subject    TEXT NOT NULL,
  score      INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  time_taken INTEGER NOT NULL DEFAULT 0,
  nickname   TEXT NOT NULL DEFAULT 'Anonymous',
  user_id    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_attempts_subject ON attempts(subject, score DESC);

-- Per-subject like counter --------------------------------------------------
CREATE TABLE IF NOT EXISTS likes (
  subject TEXT PRIMARY KEY,
  count   INTEGER NOT NULL DEFAULT 0
);

-- Comments -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  subject    TEXT,
  name       TEXT NOT NULL DEFAULT 'Guest',
  message    TEXT NOT NULL,
  user_id    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_subject ON comments(subject, created_at DESC);

-- Persistent application cache (subjects catalog, passages, etc.) -----------
CREATE TABLE IF NOT EXISTS app_cache (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
