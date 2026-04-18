import { getDb, type SourceRow } from "@/db/client";
import { fetchReddit } from "./reddit";
import { fetchRss } from "./rss";
import type { FetchResult } from "./types";

export async function fetchAll(): Promise<FetchResult[]> {
  const db = getDb();
  const sources = db
    .prepare("SELECT * FROM sources WHERE enabled = 1 ORDER BY id")
    .all() as SourceRow[];

  const settled = await Promise.allSettled(
    sources.map((s) => (s.kind === "reddit" ? fetchReddit(s) : fetchRss(s)))
  );

  return settled.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { source: sources[i], items: [], error: r.reason?.message ?? String(r.reason) }
  );
}

export type { FetchResult, NormalizedItem } from "./types";
