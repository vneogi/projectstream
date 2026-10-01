type Counter = { count: number; resetAt: number };

const buckets = new Map<string, Counter>();

function prune(now: number) {
  if (buckets.size < 2000) return;
  for (const [key, row] of buckets) {
    if (row.resetAt <= now) buckets.delete(key);
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return request.headers.get("x-real-ip")?.trim().slice(0, 64) || "unknown";
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  const row = buckets.get(key);
  if (!row || row.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (row.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((row.resetAt - now) / 1000)),
    };
  }
  row.count += 1;
  return { ok: true };
}

export function rateLimitResponse(retryAfterSec: number) {
  return {
    status: 429 as const,
    body: {
      error: "Too many requests. Please wait a minute and try again.",
      retryAfterSec,
    },
    headers: { "Retry-After": String(retryAfterSec) },
  };
}

export function denyIfRateLimited(
  request: Request,
  bucket: string,
  limit: number,
  windowMs: number,
): { denied: false } | { denied: true; retryAfterSec: number } {
  const result = rateLimit(`${bucket}:${clientIp(request)}`, limit, windowMs);
  if (result.ok) return { denied: false };
  return { denied: true, retryAfterSec: result.retryAfterSec };
}
