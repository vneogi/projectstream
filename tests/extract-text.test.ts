import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractEmbeddedPdfText,
  extractTextFromUpload,
  isWeakExtractedContent,
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
