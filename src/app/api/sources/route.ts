import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, type SourceRow } from "@/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  kind: z.enum(["reddit", "rss"]),
  identifier: z.string().min(1).max(500),
  label: z.string().min(1).max(100),
});

const updateSchema = z.object({
  id: z.number().int().positive(),
  enabled: z.boolean(),
});

export async function GET() {
  const db = getDb();
  const sources = db.prepare("SELECT * FROM sources ORDER BY kind, label").all() as SourceRow[];
  return NextResponse.json({ sources });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const db = getDb();

  const update = updateSchema.safeParse(body);
  if (update.success) {
    db.prepare("UPDATE sources SET enabled = ? WHERE id = ?").run(
      update.data.enabled ? 1 : 0,
      update.data.id
    );
    return NextResponse.json({ ok: true });
  }

  const create = createSchema.safeParse(body);
  if (!create.success) {
    return NextResponse.json({ error: create.error.message }, { status: 400 });
  }

  let identifier = create.data.identifier.trim();
  if (create.data.kind === "reddit") {
    identifier = identifier.replace(/^\/?r\//, "").replace(/\/$/, "");
  } else {
    try {
      new URL(identifier);
    } catch {
      return NextResponse.json({ error: "URL RSS invalide" }, { status: 400 });
    }
  }

  try {
    const info = db
      .prepare("INSERT INTO sources (kind, identifier, label) VALUES (?, ?, ?)")
      .run(create.data.kind, identifier, create.data.label);
    return NextResponse.json({ id: info.lastInsertRowid });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Source déjà présente" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "id invalide" }, { status: 400 });
  }
  getDb().prepare("DELETE FROM sources WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
