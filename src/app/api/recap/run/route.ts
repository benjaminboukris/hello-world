import { NextResponse } from "next/server";
import { runDailyRecap } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { force?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // ignore, treat as empty
  }
  const result = await runDailyRecap({ force: body.force });
  const ok = result.status === "success" || result.status === "partial" || result.status === "skipped";
  return NextResponse.json(result, { status: ok ? 200 : 500 });
}
