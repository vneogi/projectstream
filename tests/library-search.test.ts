import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  questionTokens,
} from "../src/lib/library-search.ts";
import { searchPosts } from "../src/lib/seed-data.ts";

describe("questionTokens", () => {
  it("drops stop words and punctuation from a real student question", () => {
    const tokens = questionTokens("How do I balance chemical equations?");
    assert.deepEqual(tokens, ["balance", "chemical", "equations"]);
  });
});

describe("rankPostsForQuery", () => {
  it("finds the chemistry article from a full sentence", () => {
    const results = searchPosts("How do I balance chemical equations?");
    assert.ok(
      results.some((p) => p.slug === "balance-equations-tips"),
      "expected the balancing-equations article",
    );
  });

  it("still finds a short keyword", () => {
    const results = searchPosts("photosynthesis");
    assert.ok(results.some((p) => p.slug === "photosynthesis-diagram"));
  });

  it("returns every published post for an empty query", () => {
    const all = searchPosts("");
    assert.ok(all.length >= 1);
  });
});
