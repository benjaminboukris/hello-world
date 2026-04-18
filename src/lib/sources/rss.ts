import Parser from "rss-parser";
import type { SourceRow } from "@/db/client";
import type { FetchResult, NormalizedItem } from "./types";

const parser = new Parser({
  timeout: 15_000,
  headers: { "User-Agent": "recap-app/0.1 (+rss)" },
});

const DAY_MS = 24 * 60 * 60 * 1000;

export async function fetchRss(source: SourceRow): Promise<FetchResult> {
  try {
    const feed = await parser.parseURL(source.identifier);
    const cutoff = Date.now() - DAY_MS;

    const items: NormalizedItem[] = (feed.items ?? [])
      .map((entry) => {
        const pubStr = entry.isoDate ?? entry.pubDate;
        const publishedAt = pubStr ? new Date(pubStr).getTime() : Date.now();
        return {
          external_id: entry.guid ?? entry.link ?? null,
          url: entry.link ?? "",
          title: entry.title ?? "(sans titre)",
          author: entry.creator ?? entry.author ?? null,
          content: (entry.contentSnippet ?? entry.content ?? "").slice(0, 2000) || null,
          published_at: publishedAt,
        };
      })
      .filter((it) => it.url && it.published_at >= cutoff);

    return { source, items, error: null };
  } catch (err) {
    return {
      source,
      items: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
