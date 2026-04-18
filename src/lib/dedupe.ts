import { createHash } from "node:crypto";

function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    // strip common tracking params
    const strip = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "ref_src"];
    for (const k of strip) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return url.trim();
  }
}

export function dedupeHash(title: string, url: string): string {
  const key = title.trim().toLowerCase() + "|" + canonicalUrl(url);
  return createHash("sha256").update(key).digest("hex");
}
