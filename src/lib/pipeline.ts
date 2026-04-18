import { getDb, type ItemRow, type SourceRow } from "@/db/client";
import { dedupeHash } from "./dedupe";
import { fetchAll } from "./sources";
import { summarize } from "./summarize";

function todayISO(): string {
  const tz = process.env.TZ ?? "Europe/Paris";
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}

export type RunResult = {
  date: string;
  status: "success" | "partial" | "failed" | "skipped";
  itemCount: number;
  errors: { source: string; error: string }[];
  message?: string;
};

export async function runDailyRecap(options: { force?: boolean } = {}): Promise<RunResult> {
  const db = getDb();
  const date = todayISO();
  const errors: { source: string; error: string }[] = [];

  const existing = db
    .prepare("SELECT id, status FROM recaps WHERE recap_date = ?")
    .get(date) as { id: number; status: string } | undefined;

  if (existing && existing.status === "success" && !options.force) {
    return { date, status: "skipped", itemCount: 0, errors: [], message: "Déjà généré pour aujourd'hui." };
  }

  const recapId = existing
    ? existing.id
    : (db
        .prepare("INSERT INTO recaps (recap_date, status) VALUES (?, 'pending')")
        .run(date).lastInsertRowid as number);

  if (existing) {
    db.prepare("UPDATE recaps SET status = 'pending', error = NULL WHERE id = ?").run(recapId);
    db.prepare("DELETE FROM recap_items WHERE recap_id = ?").run(recapId);
  }

  const fetched = await fetchAll();
  for (const f of fetched) {
    if (f.error) errors.push({ source: `${f.source.kind}:${f.source.label}`, error: f.error });
  }

  const insertItem = db.prepare(
    `INSERT OR IGNORE INTO items
       (source_id, external_id, url, title, author, content, published_at, dedupe_hash)
     VALUES (@source_id, @external_id, @url, @title, @author, @content, @published_at, @dedupe_hash)`
  );
  const getItemByHash = db.prepare("SELECT * FROM items WHERE dedupe_hash = ?");
  const linkItem = db.prepare(
    "INSERT OR IGNORE INTO recap_items (recap_id, item_id) VALUES (?, ?)"
  );

  const insertMany = db.transaction(() => {
    const groups: { source: SourceRow; items: ItemRow[] }[] = [];
    for (const f of fetched) {
      const picked: ItemRow[] = [];
      for (const it of f.items) {
        if (!it.url || !it.title) continue;
        const hash = dedupeHash(it.title, it.url);
        insertItem.run({
          source_id: f.source.id,
          external_id: it.external_id,
          url: it.url,
          title: it.title,
          author: it.author,
          content: it.content,
          published_at: it.published_at,
          dedupe_hash: hash,
        });
        const row = getItemByHash.get(hash) as ItemRow | undefined;
        if (row) {
          linkItem.run(recapId, row.id);
          picked.push(row);
        }
      }
      if (picked.length > 0) groups.push({ source: f.source, items: picked });
    }
    return groups;
  });

  const groups = insertMany();
  const totalItems = groups.reduce((acc, g) => acc + g.items.length, 0);

  if (totalItems === 0) {
    db.prepare(
      "UPDATE recaps SET status = 'failed', error = ?, item_count = 0 WHERE id = ?"
    ).run(errors.length ? JSON.stringify(errors) : "Aucun item trouvé.", recapId);
    return { date, status: "failed", itemCount: 0, errors, message: "Aucun item récupéré." };
  }

  try {
    const summary = await summarize(groups);
    db.prepare(
      `UPDATE recaps
          SET summary_md = ?, item_count = ?, model = ?,
              input_tokens = ?, output_tokens = ?,
              status = ?, error = ?
        WHERE id = ?`
    ).run(
      summary.markdown,
      totalItems,
      summary.model,
      summary.inputTokens,
      summary.outputTokens,
      errors.length ? "partial" : "success",
      errors.length ? JSON.stringify(errors) : null,
      recapId
    );
    return {
      date,
      status: errors.length ? "partial" : "success",
      itemCount: totalItems,
      errors,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    db.prepare("UPDATE recaps SET status = 'failed', error = ? WHERE id = ?").run(message, recapId);
    return { date, status: "failed", itemCount: totalItems, errors, message };
  }
}
