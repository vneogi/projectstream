/** Cap article body so Vercel JSON saves stay under the ~4.5MB request limit. */
export const MAX_ARTICLE_CHARS = 50_000;

/** True when ingest stored a placeholder instead of real notes. */
export function isWeakExtractedContent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("little or no extractable") ||
    t.includes("little extractable text") ||
    t.includes("content not available due to scanned") ||
    t.includes("photo or scanned page") ||
    t.includes("could not read selectable text") ||
    isGarbageExtractedText(text)
  );
}

/**
 * Compressed PDFs often look like letters if we naively scrape `(...)`
 * strings. Real notes are mostly readable English; binary dumps are not.
 */
export function isGarbageExtractedText(text: string): boolean {
  const sample = text.slice(0, 2500);
  if (sample.trim().length < 40) return false;

  let letters = 0;
  let weird = 0;
  for (let i = 0; i < sample.length; i++) {
    const c = sample.charCodeAt(i);
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) letters += 1;
    if (c === 0 || c === 0xfffd || c < 9 || (c > 13 && c < 32)) weird += 1;
    if (c >= 0x80 && c < 0xa0) weird += 1;
  }

  const replacement = (sample.match(/\uFFFD/g) || []).length;
  const latinWords = (sample.match(/\b[A-Za-z]{3,}\b/g) || []).length;
  if (replacement > 6) return true;
  if (weird > sample.length * 0.08) return true;
  if (letters < sample.length * 0.28 && latinWords < 18) return true;
  return letters / sample.length < 0.18 && sample.length > 80;
}

export function scannedFilePlaceholder(fileName?: string): string {
  const label = fileName?.trim() ? `"${fileName.trim()}"` : "the original file";
  return `Could not read selectable text from ${label}. The PDF or image is attached for download. Type a short overview in Content, then use Auto-fill.`;
}

/** Strip null bytes and refuse binary PDF dumps so article saves stay valid. */
export function sanitizeArticleContent(text: string, fileHint?: string): string {
  const cleaned = String(text ?? "")
    .replace(/\u0000/g, "")
    .trim();
  if (!cleaned) return "";
  if (isGarbageExtractedText(cleaned)) {
    return scannedFilePlaceholder(fileHint);
  }
  return cleaned.slice(0, MAX_ARTICLE_CHARS);
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
    if (!/[a-zA-Z]{3,}/.test(decoded)) continue;
    if (isGarbageExtractedText(decoded) && decoded.length > 60) continue;
    parts.push(decoded);
  }
  const joined = parts.join(" ").replace(/\s+/g, " ").trim();
  if (isGarbageExtractedText(joined)) return "";
  return joined;
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
    if (text.length >= 40 && !isGarbageExtractedText(text)) {
      return { text, note: "Extracted selectable text from the PDF." };
    }
    return {
      text: "",
      note: "This looks like a scanned or compressed PDF with no readable text to paste. The file is attached for download. Type a short overview in Content, then Auto-fill — or send the file by email so Gmail OCR can run.",
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
