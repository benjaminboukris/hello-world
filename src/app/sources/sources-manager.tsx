"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SourceRow } from "@/db/client";

export function SourcesManager({ initialSources }: { initialSources: SourceRow[] }) {
  const router = useRouter();
  const [sources, setSources] = useState(initialSources);
  const [kind, setKind] = useState<"reddit" | "rss">("reddit");
  const [identifier, setIdentifier] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const res = await fetch("/api/sources");
    const body = await res.json();
    setSources(body.sources);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, identifier: identifier.trim(), label: label.trim() || identifier.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setIdentifier("");
      setLabel("");
      await reload();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: number, enabled: boolean) {
    await fetch("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    await reload();
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("Supprimer cette source ?")) return;
    await fetch(`/api/sources?id=${id}`, { method: "DELETE" });
    await reload();
    router.refresh();
  }

  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ajouter une source</h2>
        <form className="stack" onSubmit={add}>
          <div className="row">
            <select value={kind} onChange={(e) => setKind(e.target.value as "reddit" | "rss")}>
              <option value="reddit">Reddit</option>
              <option value="rss">RSS (Twitter/Insta/blog)</option>
            </select>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={kind === "reddit" ? "france" : "https://nitter.example.com/user/rss"}
              required
              style={{ flex: 1, minWidth: 240 }}
            />
          </div>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optionnel)"
          />
          <div>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Ajout…" : "Ajouter"}
            </button>
          </div>
          {error && <div className="errors"><strong>Erreur:</strong> {error}</div>}
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Sources ({sources.length})</h2>
        {sources.length === 0 && <p className="muted">Aucune source configurée.</p>}
        {sources.map((s) => (
          <div key={s.id} className="source-row">
            <div className="source-info">
              <div className="source-label">
                <span className="badge">{s.kind}</span> {s.label}
              </div>
              <div className="source-id">{s.identifier}</div>
            </div>
            <div className="row-actions">
              <button
                className="btn btn-secondary"
                onClick={() => toggle(s.id, !s.enabled)}
              >
                {s.enabled ? "Désactiver" : "Activer"}
              </button>
              <button className="btn btn-danger" onClick={() => remove(s.id)}>Suppr.</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
