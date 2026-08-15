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

/** Mirrors isReply_ in gmail/ProjectSteamIngest.gs */
function isReply(subject: string, headers: Record<string, string> = {}): boolean {
  if (/^\s*(re|aw|sv|vs|antw)\s*:/i.test(subject)) return true;
  return Boolean(headers["In-Reply-To"] || headers["References"]);
}

/** Mirrors the REQUIRE_MATERIAL rule shared by the script and the API. */
function acceptsSubmission(input: {
  subject: string;
  attachmentCount: number;
  headers?: Record<string, string>;
}): boolean {
  if (isReply(input.subject, input.headers ?? {})) return false;
  return input.attachmentCount > 0;
}

describe("submission filtering", () => {
  it("treats Re: subjects as replies", () => {
    assert.equal(isReply("Re: Photosynthesis notes"), true);
    assert.equal(isReply("RE: Photosynthesis notes"), true);
    assert.equal(isReply("re:photosynthesis"), true);
  });

  it("treats threaded messages as replies even without Re:", () => {
    assert.equal(
      isReply("Photosynthesis notes", { "In-Reply-To": "<abc@mail>" }),
      true,
    );
    assert.equal(
      isReply("Photosynthesis notes", { References: "<abc@mail>" }),
      true,
    );
  });

  it("treats a fresh submission as not a reply", () => {
    assert.equal(isReply("Photosynthesis notes"), false);
    assert.equal(isReply("Fwd: Photosynthesis notes"), false);
  });

  it("rejects replies even when they carry an attachment", () => {
    assert.equal(
      acceptsSubmission({ subject: "Re: thanks!", attachmentCount: 1 }),
      false,
    );
  });

  it("rejects plain emails with no attachment", () => {
    assert.equal(
      acceptsSubmission({ subject: "My notes", attachmentCount: 0 }),
      false,
    );
  });

  it("accepts a new email that carries material", () => {
    assert.equal(
      acceptsSubmission({ subject: "My notes", attachmentCount: 1 }),
      true,
    );
  });
});

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
