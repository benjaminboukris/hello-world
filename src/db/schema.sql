CREATE TABLE IF NOT EXISTS sources (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  kind       TEXT NOT NULL CHECK (kind IN ('reddit', 'rss')),
  identifier TEXT NOT NULL,
  label      TEXT NOT NULL,
  enabled    INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
  UNIQUE (kind, identifier)
);

CREATE TABLE IF NOT EXISTS items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id    INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id  TEXT,
  url          TEXT NOT NULL,
  title        TEXT NOT NULL,
  author       TEXT,
  content      TEXT,
  published_at INTEGER NOT NULL,
  fetched_at   INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
  dedupe_hash  TEXT NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_items_published_at ON items(published_at);
CREATE INDEX IF NOT EXISTS idx_items_source_id    ON items(source_id);

CREATE TABLE IF NOT EXISTS recaps (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  recap_date    TEXT NOT NULL UNIQUE,
  summary_md    TEXT,
  item_count    INTEGER NOT NULL DEFAULT 0,
  model         TEXT,
  input_tokens  INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','partial','failed')),
  error         TEXT,
  created_at    INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_recaps_date ON recaps(recap_date);

CREATE TABLE IF NOT EXISTS recap_items (
  recap_id INTEGER NOT NULL REFERENCES recaps(id) ON DELETE CASCADE,
  item_id  INTEGER NOT NULL REFERENCES items(id)  ON DELETE CASCADE,
  PRIMARY KEY (recap_id, item_id)
);
