import Link from "next/link";
import { getDb, type RecapRow } from "@/db/client";
import { renderMarkdown } from "@/lib/markdown";
import { formatFrenchDate, statusLabel } from "@/lib/format";
import { RunRecapButton } from "./run-button";

export const dynamic = "force-dynamic";

function todayISO(): string {
  const tz = process.env.TZ ?? "Europe/Paris";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function Page() {
  const date = todayISO();
  const db = getDb();
  const recap = db
    .prepare("SELECT * FROM recaps WHERE recap_date = ?")
    .get(date) as RecapRow | undefined;
  const sourceCount = (db.prepare("SELECT COUNT(*) as c FROM sources WHERE enabled = 1").get() as { c: number }).c;

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Aujourd&apos;hui</h1>
          <div className="meta">{formatFrenchDate(date)}</div>
        </div>
        <RunRecapButton hasRecap={recap?.status === "success"} />
      </div>

      {!recap && (
        <div className="empty">
          <p>Pas encore de récap pour aujourd&apos;hui.</p>
          {sourceCount === 0 ? (
            <p>
              Commence par <Link href="/sources">ajouter des sources</Link>.
            </p>
          ) : (
            <p>Clique sur « Générer maintenant » pour lancer la synthèse.</p>
          )}
        </div>
      )}

      {recap && recap.status !== "success" && !recap.summary_md && (
        <div className="empty">
          <p>
            <span className={`badge badge-${recap.status}`}>{statusLabel(recap.status)}</span>
          </p>
          {recap.error && <p className="muted">{recap.error.slice(0, 400)}</p>}
        </div>
      )}

      {recap?.summary_md && (
        <article className="card recap" dangerouslySetInnerHTML={{ __html: renderMarkdown(recap.summary_md) }} />
      )}

      {recap && (
        <div className="meta" style={{ marginTop: 16 }}>
          <span className={`badge badge-${recap.status}`}>{statusLabel(recap.status)}</span>
          {" · "}
          {recap.item_count} items {recap.model ? `· ${recap.model}` : ""}
          {recap.input_tokens ? ` · ${recap.input_tokens}↓/${recap.output_tokens}↑ tokens` : ""}
        </div>
      )}
    </div>
  );
}
