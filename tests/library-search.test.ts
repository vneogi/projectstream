import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  askTopicTokens,
  publicAskContext,
  questionTokens,
  rankPostsForAsk,
  rankPostsForQuery,
  suggestPostsForQuery,
} from "../src/lib/library-search.ts";
import { searchPosts } from "../src/lib/seed-data.ts";
import type { Post } from "../src/lib/types.ts";

describe("questionTokens", () => {
  it("drops stop words and punctuation from a real student question", () => {
    const tokens = questionTokens("How do I balance chemical equations?");
    assert.deepEqual(tokens, ["balance", "chemical", "equations"]);
  });

  it("does not treat site-how-to wording as a library topic", () => {
    assert.deepEqual(askTopicTokens("how to use project steam website?"), []);
    assert.ok(askTopicTokens("How do I balance chemical equations?").includes("equations"));
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

  it("finds a relevant article despite student spelling mistakes", () => {
    const seed = searchPosts("")[0];
    assert.ok(seed);
    const internet: Post = {
      ...seed,
      id: "internet",
      title: "How the Internet Works",
      slug: "how-the-internet-works",
      excerpt: "Routers and networks move packets between connected devices.",
      abstract: "The internet links devices through routers, DNS, and servers.",
      content: "Internet data travels in packets.",
      subjectSlug: "computer-science",
      subjectName: "Computer Science",
      topics: ["internet", "networks", "routers"],
    };
    const unrelated: Post = {
      ...internet,
      id: "budget",
      title: "Student Budgeting Worksheet",
      slug: "student-budget",
      excerpt: "Students practise the 50-30-20 budgeting rule.",
      abstract: "A worksheet about income, saving, and spending decisions.",
      subjectSlug: "mathematics",
      subjectName: "Mathematics",
      topics: ["budget", "money"],
    };
    const ranked = rankPostsForAsk(
      [unrelated, internet],
      "how does the intttunet wrk",
    );
    assert.equal(ranked[0]?.slug, internet.slug);
    assert.deepEqual(ranked.map((post) => post.slug), [internet.slug]);
  });

  it("ignores unrelated legacy abstracts when selecting Ask sources", () => {
    const seed = searchPosts("")[0];
    assert.ok(seed);
    const relevant: Post = {
      ...seed,
      id: "plant",
      title: "Photosynthesis Basics",
      slug: "photosynthesis",
      excerpt: "Plants convert light into chemical energy.",
      abstract: "Chlorophyll helps plants use light.",
      subjectSlug: "biology",
      subjectName: "Biology",
      topics: ["photosynthesis", "plants"],
    };
    const contaminated: Post = {
      ...seed,
      id: "internet",
      title: "How the Internet Works",
      slug: "internet",
      excerpt: "Students work with routers and connected devices.",
      abstract:
        "Malformed legacy extraction accidentally mentions photosynthesis.",
      subjectSlug: "computer-science",
      subjectName: "Computer Science",
      topics: ["internet", "networks"],
    };

    const ranked = rankPostsForAsk(
      [contaminated, relevant],
      "how does photosynthesis work",
    );
    assert.deepEqual(ranked.map((post) => post.slug), [relevant.slug]);
  });

  it("suggests same-subject articles when an exact topic is unpublished", () => {
    const biology = searchPosts("").filter((post) => post.subjectSlug === "biology");
    const suggestions = suggestPostsForQuery(biology, "How does photosynthesis work?");
    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.every((post) => post.subjectSlug === "biology"));
  });

  it("builds Ask AI context without protected full notes", () => {
    const post = searchPosts("")[0];
    assert.ok(post);
    const privateMarker = "PRIVATE-FULL-NOTES-MARKER";
    const context = publicAskContext(
      { ...post, content: privateMarker },
      0,
    );
    assert.match(context, new RegExp(post.title));
    assert.match(context, /Summary:/);
    assert.match(context, /Abstract:/);
    assert.doesNotMatch(context, new RegExp(privateMarker));
  });
});
