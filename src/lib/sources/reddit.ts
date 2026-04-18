import Snoowrap from "snoowrap";
import type { SourceRow } from "@/db/client";
import type { FetchResult, NormalizedItem } from "./types";

let client: Snoowrap | null = null;

function getClient(): Snoowrap {
  if (client) return client;
  const {
    REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET,
    REDDIT_USERNAME,
    REDDIT_PASSWORD,
    REDDIT_USER_AGENT,
  } = process.env;

  if (
    !REDDIT_CLIENT_ID ||
    !REDDIT_CLIENT_SECRET ||
    !REDDIT_USERNAME ||
    !REDDIT_PASSWORD ||
    !REDDIT_USER_AGENT
  ) {
    throw new Error(
      "Reddit credentials missing. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, REDDIT_USER_AGENT."
    );
  }

  client = new Snoowrap({
    userAgent: REDDIT_USER_AGENT,
    clientId: REDDIT_CLIENT_ID,
    clientSecret: REDDIT_CLIENT_SECRET,
    username: REDDIT_USERNAME,
    password: REDDIT_PASSWORD,
  });
  return client;
}

export async function fetchReddit(source: SourceRow): Promise<FetchResult> {
  try {
    const sub = source.identifier.replace(/^r\//, "");
    const posts = await getClient().getSubreddit(sub).getTop({ time: "day", limit: 25 });

    const items: NormalizedItem[] = posts.map((p) => ({
      external_id: p.id,
      url: `https://www.reddit.com${p.permalink}`,
      title: p.title,
      author: p.author?.name ?? null,
      content: p.selftext ? p.selftext.slice(0, 2000) : null,
      published_at: Math.floor(p.created_utc * 1000),
    }));

    return { source, items, error: null };
  } catch (err) {
    return {
      source,
      items: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
