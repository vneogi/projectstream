import { NextResponse } from "next/server";
import { denyIfRateLimited, rateLimitResponse } from "@/lib/rate-limit";

export function jsonTooMany(retryAfterSec: number) {
  const payload = rateLimitResponse(retryAfterSec);
  return NextResponse.json(payload.body, {
    status: payload.status,
    headers: payload.headers,
  });
}

export function limitOrRespond(
  request: Request,
  bucket: string,
  limit: number,
  windowMs: number,
) {
  const check = denyIfRateLimited(request, bucket, limit, windowMs);
  if (!check.denied) return null;
  return jsonTooMany(check.retryAfterSec);
}
