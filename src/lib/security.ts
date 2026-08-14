export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export function verifyIngestSecret(headerValue: string | null): boolean {
  const expected = process.env.INGEST_SECRET;
  if (!expected) return false;
  const provided = (headerValue ?? "").replace(/^Bearer\s+/i, "").trim();
  return timingSafeEqual(provided, expected);
}
