import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterAndSortAdminPosts } from "../src/lib/admin-posts.ts";
import { seedPosts } from "../src/lib/seed-data.ts";
import type { Post } from "../src/lib/types.ts";

function post(
  id: string,
  status: "draft" | "published",
  createdAt: string,
): Post {
  return {
    ...seedPosts[0],
    id,
    slug: id,
    status,
    createdAt,
    updatedAt: createdAt,
  };
}

const posts = [
  post("published-new", "published", "2026-09-03T00:00:00Z"),
  post("draft-old", "draft", "2026-09-01T00:00:00Z"),
  post("draft-new", "draft", "2026-09-04T00:00:00Z"),
  post("published-old", "published", "2026-09-02T00:00:00Z"),
];

describe("Editor post filtering and sorting", () => {
  it("defaults to drafts first and newest within each status", () => {
    const result = filterAndSortAdminPosts(posts, "all", "draft-newest");
    assert.deepEqual(
      result.map((item) => item.id),
      ["draft-new", "draft-old", "published-new", "published-old"],
    );
  });

  it("can show only published articles", () => {
    const result = filterAndSortAdminPosts(
      posts,
      "published",
      "draft-newest",
    );
    assert.deepEqual(
      result.map((item) => item.id),
      ["published-new", "published-old"],
    );
  });

  it("can sort everything by date", () => {
    const result = filterAndSortAdminPosts(posts, "all", "newest");
    assert.deepEqual(
      result.map((item) => item.id),
      ["draft-new", "published-new", "published-old", "draft-old"],
    );
  });
});
