import type { SourceRow } from "@/db/client";

export type NormalizedItem = {
  external_id: string | null;
  url: string;
  title: string;
  author: string | null;
  content: string | null;
  published_at: number;
};

export type FetchResult = {
  source: SourceRow;
  items: NormalizedItem[];
  error: string | null;
};
