import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapPostRow } from "../src/lib/map-post.ts";

describe("mapPostRow", () => {
  it("maps snake_case DB columns into Post fields", () => {
    const post = mapPostRow({
      id: "abc",
      title: "Title",
      slug: "title",
      excerpt: "Short",
      content: "Body",
      subject_id: "physics",
      subject_slug: "physics",
      subject_name: "Physics",
      topics: ["forces"],
      author_name: "Aanya",
      author_school: "Class 10",
      language: "en",
      status: "draft",
      source_message_id: "msg-1",
      source_from: "aanya@school.edu",
      file_path: "abc/notes.pdf",
      file_name: "notes.pdf",
      file_mime: "application/pdf",
      file_size: 1024,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    });

    assert.equal(post.id, "abc");
    assert.equal(post.status, "draft");
    assert.equal(post.subjectSlug, "physics");
    assert.equal(post.sourceMessageId, "msg-1");
    assert.equal(post.filePath, "abc/notes.pdf");
    assert.equal(post.fileSize, 1024);
    assert.equal(post.authorSchool, "Class 10");
  });

  it("handles missing optional file/source fields", () => {
    const post = mapPostRow({
      id: "1",
      title: "T",
      slug: "t",
      content: "c",
      subject_id: "x",
      subject_slug: "general-stem",
      subject_name: "General STEM",
      status: "published",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    assert.equal(post.excerpt, "");
    assert.equal(post.authorName, "Contributor");
    assert.equal(post.language, "en");
    assert.deepEqual(post.topics, []);
    assert.equal(post.filePath, undefined);
    assert.equal(post.sourceMessageId, undefined);
  });

  it("coerces string file_size to number", () => {
    const post = mapPostRow({
      id: "1",
      title: "T",
      slug: "t",
      content: "c",
      subject_id: "x",
      subject_slug: "general-stem",
      subject_name: "General STEM",
      status: "published",
      file_size: "2048",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(post.fileSize, 2048);
  });
});
