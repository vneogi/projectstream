/** True when ingest stored a placeholder instead of real notes. */
export function isWeakExtractedContent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("little or no extractable") ||
    t.includes("little extractable text") ||
    t.includes("content not available due to scanned") ||
    t.includes("photo or scanned page")
  );
}

/**
 * Pulls already-embedded text from a digital PDF. Image-only / scanned
 * PDFs return empty — those need Drive OCR (Apps Script) or a typed summary.
 */
export function extractEmbeddedPdfText(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const parts: string[] = [];
  const re = /\(((?:\\.|[^\\)]){3,})\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const decoded = match[1]
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "")
      .replace(/\\t/g, " ")
      .replace(/\\(.)/g, "$1");
    if (/[a-zA-Z]{3,}/.test(decoded)) parts.push(decoded);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function extractTextFromUpload(
  fileName: string,
  mime: string,
  buffer: Buffer,
): { text: string; note: string } {
  const lower = fileName.toLowerCase();
  const type = mime.toLowerCase();

  if (lower.endsWith(".txt") || type.startsWith("text/plain")) {
    return { text: buffer.toString("utf8").trim(), note: "Read as plain text." };
  }

  if (lower.endsWith(".pdf") || type.includes("pdf")) {
    const text = extractEmbeddedPdfText(buffer);
    if (text.length >= 40) {
      return { text, note: "Extracted selectable text from the PDF." };
    }
    return {
      text: "",
      note: "This looks like a scanned or image-only PDF. The file is attached for download. Add a short typed overview in Content, then Auto-fill — or re-run Gmail ingest after the OCR update.",
    };
  }

  if (
    type.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|tiff?|heic|heif|img)$/i.test(lower)
  ) {
    return {
      text: "",
      note: "Image attached for download. Type a few lines describing the pages in Content, then Auto-fill. For several photos, combine them into one PDF first.",
    };
  }

  return {
    text: "",
    note: "File attached for download. Office formats are parsed from email ingest; here, add notes in Content and Auto-fill if needed.",
  };
}
