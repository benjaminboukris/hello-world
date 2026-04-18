import { getDb } from "../src/db/client";

const DEFAULTS: { kind: "reddit" | "rss"; identifier: string; label: string }[] = [
  { kind: "reddit", identifier: "france", label: "r/france" },
  { kind: "reddit", identifier: "programming", label: "r/programming" },
  { kind: "reddit", identifier: "worldnews", label: "r/worldnews" },
];

const db = getDb();
const stmt = db.prepare(
  "INSERT OR IGNORE INTO sources (kind, identifier, label) VALUES (?, ?, ?)"
);

for (const s of DEFAULTS) {
  const info = stmt.run(s.kind, s.identifier, s.label);
  const action = info.changes > 0 ? "ajouté" : "déjà présent";
  console.log(`${s.kind}:${s.identifier} — ${action}`);
}

console.log("Seed terminé.");
