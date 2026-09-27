import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  downloadLabel,
  isAllowedMaterial,
} from "../src/lib/file-types.ts";

describe("allowed study files", () => {
  it("accepts Word, images, and spreadsheets as well as PDF/PPTX", () => {
    assert.equal(isAllowedMaterial("notes.docx"), true);
    assert.equal(isAllowedMaterial("notes.doc"), true);
    assert.equal(isAllowedMaterial("diagram.png"), true);
    assert.equal(isAllowedMaterial("scan.IMG"), true);
    assert.equal(isAllowedMaterial("photo.jpg", "image/jpeg"), true);
    assert.equal(isAllowedMaterial("data.xlsx"), true);
    assert.equal(isAllowedMaterial("slides.pptx"), true);
  });

  it("rejects unrelated files", () => {
    assert.equal(isAllowedMaterial("virus.exe"), false);
    assert.equal(isAllowedMaterial("song.mp3"), false);
  });

  it("labels downloads by type instead of always saying PDF", () => {
    assert.equal(downloadLabel("notes.pdf"), "PDF");
    assert.equal(downloadLabel("diagram.png"), "image");
    assert.equal(downloadLabel("essay.docx"), "document");
  });
});
