import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const path = process.env.DATABASE_PATH ?? "./data/recap.db";
  const absPath = resolve(path);
  mkdirSync(dirname(absPath), { recursive: true });

  db = new Database(absPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schemaPath = resolve(process.cwd(), "src/db/schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  db.exec(schema);

  return db;
}

export type SourceRow = {
  id: number;
  kind: "reddit" | "rss";
  identifier: string;
  label: string;
  enabled: number;
  created_at: number;
};

export type ItemRow = {
  id: number;
  source_id: number;
  external_id: string | null;
  url: string;
  title: string;
  author: string | null;
  content: string | null;
  published_at: number;
  fetched_at: number;
  dedupe_hash: string;
};

export type RecapRow = {
  id: number;
  recap_date: string;
  summary_md: string | null;
  item_count: number;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  status: "pending" | "success" | "partial" | "failed";
  error: string | null;
  created_at: number;
};
