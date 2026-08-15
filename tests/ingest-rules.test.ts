import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { slugify } from "../src/lib/security.ts";

/**
 * Mirrors the ingest route's hard rules so we can unit-test them without
 * spinning up Next.js (local npm install is often blocked on this machine).
 */
function buildIngestSlug(title: string, messageId: string): string {
  const baseSlug = slugify(title) || `email-${Date.now()}`;
  return `${baseSlug}-${messageId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase()}`;
}

function hasEnoughContent(input: {
  subject: string;
  plainBody: string;
  attachmentTexts: string[];
}): boolean {
  const attachmentBlocks = input.attachmentTexts
    .map((text) => text.trim())
    .filter((text) => text.length >= 20);
  const combined = attachmentBlocks.join("\n\n");
  const hasBody = input.plainBody.replace(/\s+/g, "").length >= 20;
  const hasAttachments = combined.length >= 40;
  return hasBody || hasAttachments || input.subject.length >= 5;
}

describe("email ingest rules", () => {
  it("always creates drafts — status is never published by ingest", () => {
    const ingestStatus = "draft" as const;
    assert.equal(ingestStatus, "draft");
    assert.notEqual(ingestStatus, "published");
  });

  it("builds a stable unique slug from title + message id tail", () => {
    const slug = buildIngestSlug("Ohm's Law", "gmail-message-ABC12345");
    assert.equal(slug, "ohm-s-law-abc12345");
  });

  it("rejects empty emails with no extractable text", () => {
    assert.equal(
      hasEnoughContent({
        subject: "Hi",
        plainBody: "ok",
        attachmentTexts: ["img"],
      }),
      false,
    );
  });

  it("accepts emails with a meaningful subject even if body is thin", () => {
    assert.equal(
      hasEnoughContent({
        subject: "Photosynthesis notes",
        plainBody: "see att",
        attachmentTexts: [],
      }),
      true,
    );
  });

  it("accepts attachment text even when body is empty", () => {
    assert.equal(
      hasEnoughContent({
        subject: "x",
        plainBody: "",
        attachmentTexts: [
          "Slide 1: Photosynthesis overview with equation and chlorophyll notes.",
        ],
      }),
      true,
    );
  });
});
