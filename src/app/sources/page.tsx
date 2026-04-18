import { getDb, type SourceRow } from "@/db/client";
import { SourcesManager } from "./sources-manager";

export const dynamic = "force-dynamic";

export default function SourcesPage() {
  const db = getDb();
  const sources = db.prepare("SELECT * FROM sources ORDER BY kind, label").all() as SourceRow[];

  return (
    <div>
      <h1>Sources</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Reddit : nom du subreddit (ex. <code>france</code>). RSS : URL complète du flux
        (Nitter, rss.app, etc.).
      </p>
      <SourcesManager initialSources={sources} />
    </div>
  );
}
