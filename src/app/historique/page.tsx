import Link from "next/link";
import { getDb, type RecapRow } from "@/db/client";
import { formatFrenchDate, statusLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function HistoriquePage() {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM recaps ORDER BY recap_date DESC LIMIT 100")
    .all() as RecapRow[];

  return (
    <div>
      <h1>Historique</h1>
      <div className="meta">{rows.length} récap{rows.length > 1 ? "s" : ""}</div>

      {rows.length === 0 && (
        <div className="empty">
          <p>Aucun récap pour le moment.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="card" style={{ padding: "4px 20px" }}>
          {rows.map((r) => (
            <div key={r.id} className="history-row">
              <div>
                <Link href={`/recap/${r.recap_date}`} className="history-date">
                  {formatFrenchDate(r.recap_date)}
                </Link>
                <div className="muted" style={{ fontSize: 13 }}>
                  {r.item_count} items
                  {r.model ? ` · ${r.model}` : ""}
                </div>
              </div>
              <span className={`badge badge-${r.status}`}>{statusLabel(r.status)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
