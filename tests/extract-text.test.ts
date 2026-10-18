import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractEmbeddedPdfText,
  extractTextFromUpload,
  isGarbageExtractedText,
  isWeakExtractedContent,
  sanitizeArticleContent,
} from "../src/lib/extract-text.ts";

describe("isWeakExtractedContent", () => {
  it("detects scanned-PDF placeholders", () => {
    assert.equal(
      isWeakExtractedContent(
        "Content not available due to scanned PDF. Please download the original file for full notes.",
      ),
      true,
    );
  });
});

describe("isGarbageExtractedText", () => {
  it("flags binary-looking PDF dumps", () => {
    const dump =
      "öwªAI  Ó  Ā íí þª Px ò ĀšeG  ~;8 2Ç «© Û NE =pKÌiKá)  3N  äs:gW AŽì n . (h  ädÍîÂP80";
    assert.equal(isGarbageExtractedText(dump.repeat(8)), true);
  });

  it("keeps readable notes", () => {
    assert.equal(
      isGarbageExtractedText(
        "Photosynthesis happens in chloroplasts. Chlorophyll captures light energy so plants can make sugar.",
      ),
      false,
    );
  });
});

describe("sanitizeArticleContent", () => {
  it("replaces binary dumps so saves do not send huge garbage", () => {
    const dump = "öwªAI Ó Ā íí þª Px ".repeat(40);
    const cleaned = sanitizeArticleContent(dump);
    assert.match(cleaned, /Could not read selectable text/i);
  });
});

describe("extractEmbeddedPdfText", () => {
  it("reads parenthesized strings from a fake PDF payload", () => {
    const buffer = Buffer.from("stream (Photosynthesis happens in chloroplasts) endstream", "latin1");
    assert.match(extractEmbeddedPdfText(buffer), /Photosynthesis/);
  });
});

describe("extractTextFromUpload", () => {
  it("reads plain text files", () => {
    const result = extractTextFromUpload(
      "notes.txt",
      "text/plain",
      Buffer.from("Gravity pulls objects toward Earth."),
    );
    assert.match(result.text, /Gravity/);
  });

  it("does not invent text for an image", () => {
    const result = extractTextFromUpload("page.png", "image/png", Buffer.from([1, 2, 3]));
    assert.equal(result.text, "");
    assert.match(result.note, /Image attached/i);
  });
});
