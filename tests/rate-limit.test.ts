import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rateLimit } from "../src/lib/rate-limit.ts";

describe("rateLimit", () => {
  it("allows the first N hits then blocks", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    assert.equal(rateLimit(key, 2, 60_000).ok, true);
    assert.equal(rateLimit(key, 2, 60_000).ok, true);
    const blocked = rateLimit(key, 2, 60_000);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.ok(blocked.retryAfterSec >= 1);
  });
});
