import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  questionTokens,
  rankPostsForQuery,
} from "../src/lib/library-search.ts";
import { searchPosts } from "../src/lib/seed-data.ts";
import type { Post } from "../src/lib/types.ts";

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

  it("boosts a liked match above an unliked match for the same keyword", () => {
    const base = {
      excerpt: "About photosynthesis in leaves",
      abstract: "",
      content: "photosynthesis",
      subjectId: "biology",
      subjectSlug: "biology",
      subjectName: "Biology",
      topics: ["plants"],
      authorName: "",
      language: "en",
      status: "published" as const,
      likeCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const unliked: Post = {
      ...base,
      id: "a",
      title: "Simple photosynthesis notes",
      slug: "simple-photo",
      likeCount: 0,
    };
    const liked: Post = {
      ...base,
      id: "b",
      title: "Clear photosynthesis notes",
      slug: "clear-photo",
      likeCount: 30,
    };
    const ranked = rankPostsForQuery([unliked, liked], "photosynthesis");
    assert.equal(ranked[0].slug, "clear-photo");
  });
});
