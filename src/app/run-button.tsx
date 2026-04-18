"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunRecapButton({ hasRecap }: { hasRecap: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recap/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ force: hasRecap }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn" onClick={run} disabled={loading}>
        {loading ? "Génération…" : hasRecap ? "Régénérer" : "Générer maintenant"}
      </button>
      {error && <div className="errors" style={{ marginTop: 8 }}><strong>Erreur:</strong> {error}</div>}
    </div>
  );
}
