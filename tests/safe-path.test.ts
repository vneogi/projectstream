import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeInternalPath } from "../src/lib/safe-path.ts";

describe("safeInternalPath", () => {
  it("allows a local article path", () => {
    assert.equal(safeInternalPath("/posts/photosynthesis-diagram"), "/posts/photosynthesis-diagram");
  });

  it("allows query strings used after login", () => {
    assert.equal(safeInternalPath("/search?q=gravity"), "/search?q=gravity");
  });

  it("rejects protocol-relative and absolute URLs", () => {
    assert.equal(safeInternalPath("//evil.example/phish"), "/");
    assert.equal(safeInternalPath("https://evil.example/"), "/");
    assert.equal(safeInternalPath("/\\evil.example"), "/");
  });

  it("defaults empty values to home", () => {
    assert.equal(safeInternalPath(null), "/");
    assert.equal(safeInternalPath(""), "/");
  });
});
