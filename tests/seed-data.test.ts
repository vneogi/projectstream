import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPostBySlug,
  getPublishedPosts,
  getSubjectBySlug,
  searchPosts,
  subjects,
} from "../src/lib/seed-data.ts";

describe("seed subjects", () => {
  it("includes core STEM subjects", () => {
    const slugs = subjects.map((s) => s.slug);
    for (const expected of [
      "physics",
      "chemistry",
      "biology",
      "mathematics",
      "computer-science",
      "engineering",
      "general-stem",
    ]) {
      assert.ok(slugs.includes(expected), `missing subject ${expected}`);
    }
  });

  it("looks up subject by slug", () => {
    const physics = getSubjectBySlug("physics");
    assert.ok(physics);
    assert.equal(physics.name, "Physics");
    assert.equal(getSubjectBySlug("nope"), undefined);
  });
});

describe("seed posts + search", () => {
  it("only returns published posts by default", () => {
    const posts = getPublishedPosts();
    assert.ok(posts.length >= 1);
    assert.ok(posts.every((p) => p.status === "published"));
  });

  it("finds a known seed article by slug", () => {
    const post = getPostBySlug("night-sky-winter");
    assert.ok(post);
    assert.match(post.title, /night sky/i);
  });

  it("searches by title keywords", () => {
    const results = searchPosts("night sky");
    assert.ok(results.some((p) => p.slug === "night-sky-winter"));
  });

  it("searches by topic tags", () => {
    const results = searchPosts("astronomy");
    assert.ok(results.length >= 1);
  });

  it("returns all published posts for empty query", () => {
    assert.equal(searchPosts("").length, getPublishedPosts().length);
    assert.equal(searchPosts("   ").length, getPublishedPosts().length);
  });

  it("returns empty for nonsense query", () => {
    assert.equal(searchPosts("zzzz-not-a-real-topic-xyz").length, 0);
  });
});
