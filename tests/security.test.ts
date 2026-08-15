import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  slugify,
  timingSafeEqual,
  verifyIngestSecret,
} from "../src/lib/security.ts";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    assert.equal(slugify("Newton's Laws of Motion"), "newton-s-laws-of-motion");
  });

  it("strips leading and trailing hyphens", () => {
    assert.equal(slugify("  Hello World!  "), "hello-world");
  });

  it("caps length at 80", () => {
    const long = "a".repeat(120);
    assert.equal(slugify(long).length, 80);
  });

  it("handles empty-ish input", () => {
    assert.equal(slugify("!!!"), "");
  });
});

describe("timingSafeEqual", () => {
  it("returns true for identical strings", () => {
    assert.equal(timingSafeEqual("secret123", "secret123"), true);
  });

  it("returns false for different lengths", () => {
    assert.equal(timingSafeEqual("abc", "abcd"), false);
  });

  it("returns false for different content", () => {
    assert.equal(timingSafeEqual("secret123", "secret124"), false);
  });

  it("returns false for empty values", () => {
    assert.equal(timingSafeEqual("", ""), false);
    assert.equal(timingSafeEqual("a", ""), false);
  });
});

describe("verifyIngestSecret", () => {
  it("rejects when INGEST_SECRET is unset", () => {
    delete process.env.INGEST_SECRET;
    assert.equal(verifyIngestSecret("Bearer anything"), false);
  });

  it("accepts Bearer token matching the secret", () => {
    process.env.INGEST_SECRET = "test-secret-value";
    assert.equal(verifyIngestSecret("Bearer test-secret-value"), true);
    assert.equal(verifyIngestSecret("bearer test-secret-value"), true);
  });

  it("accepts raw secret without Bearer prefix", () => {
    process.env.INGEST_SECRET = "test-secret-value";
    assert.equal(verifyIngestSecret("test-secret-value"), true);
  });

  it("rejects wrong secrets", () => {
    process.env.INGEST_SECRET = "test-secret-value";
    assert.equal(verifyIngestSecret("Bearer wrong"), false);
    assert.equal(verifyIngestSecret(null), false);
  });
});
