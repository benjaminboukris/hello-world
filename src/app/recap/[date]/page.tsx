import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, type RecapRow } from "@/db/client";
import { renderMarkdown } from "@/lib/markdown";
import { formatFrenchDate, statusLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RecapDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const db = getDb();
  const recap = db
    .prepare("SELECT * FROM recaps WHERE recap_date = ?")
    .get(date) as RecapRow | undefined;

  if (!recap) notFound();

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>{formatFrenchDate(recap.recap_date)}</h1>
          <div className="meta">
            <span className={`badge badge-${recap.status}`}>{statusLabel(recap.status)}</span>
            {" · "}
            {recap.item_count} items
            {recap.model ? ` · ${recap.model}` : ""}
          </div>
        </div>
        <Link href="/historique" className="btn btn-secondary">← Retour</Link>
      </div>

      {recap.summary_md ? (
        <article className="card recap" dangerouslySetInnerHTML={{ __html: renderMarkdown(recap.summary_md) }} />
      ) : (
        <div className="empty">
          <p>Pas de contenu.</p>
          {recap.error && <p className="muted">{recap.error.slice(0, 400)}</p>}
        </div>
      )}
    </div>
  );
}
