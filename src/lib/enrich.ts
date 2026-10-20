import { chatCompletionDetailed, llmConfigured } from "./llm";
import {
  isGarbageExtractedText,
  isWeakExtractedContent,
  sanitizeArticleContent,
} from "./extract-text";
import { subjects } from "./seed-data";

export type EnrichResult = {
  title: string;
  excerpt: string;
  abstract: string;
  subjectSlug: string;
  topics: string[];
  authorName: string;
  content: string;
  provider: "openai" | "groq" | null;
  model?: string;
  /** Set when the LLM was skipped or failed and heuristics were used. */
  warning?: string;
  /** True when attachment OCR/extraction failed and generated copy was blocked. */
  extractionFailed?: boolean;
};

const BANNED_TOPICS = new Set([
  "from-email",
  "pdf",
  "pptx",
  "ppt",
  "docx",
  "doc",
  "attachment",
  "attachments",
  "needs-review",
  "email-submission",
  "file",
  "image",
  "scan",
  "scanned",
  "google-doc",
  "google-slides",
  "spreadsheet",
  "upload",
]);

const SUBJECT_KEYWORDS: { slug: string; words: string[] }[] = [
  {
    slug: "psychology",
    words: [
      "psychology",
      "psychological",
      "mental health",
      "behaviour",
      "behavior",
      "cognition",
      "emotion",
    ],
  },
  {
    slug: "design",
    words: [
      "graphic design",
      "design category",
      "poster",
      "visual communication",
      "typography",
      "illustration",
    ],
  },
  {
    slug: "biology",
    words: [
      "photosynthesis",
      "chlorophyll",
      "mitosis",
      "cell",
      "dna",
      "plant",
      "blood",
      "gene",
      "ecology",
      "anatomy",
    ],
  },
  {
    slug: "physics",
    words: [
      "newton",
      "force",
      "velocity",
      "ohm",
      "circuit",
      "radioactiv",
      "curie",
      "photon",
      "gravity",
      "optics",
    ],
  },
  {
    slug: "chemistry",
    words: [
      "atom",
      "molecule",
      "acid",
      "bond",
      "periodic",
      "reaction",
      "compound",
      "ion",
    ],
  },
  {
    slug: "mathematics",
    words: [
      "algebra",
      "quadratic",
      "calculus",
      "geometry",
      "equation",
      "triangle",
      "probability",
    ],
  },
  {
    slug: "computer-science",
    words: ["python", "algorithm", "program", "javascript", "coding", "loop"],
  },
  {
    slug: "engineering",
    words: ["engineering", "aerospace", "robotics", "machine", "structure"],
  },
];

const INGEST_MARKER = "## Extracted files";
const ATTACHMENT_MARKER = "### Attachment";

export type GroundedMaterial = {
  text: string;
  hasIngestMarkers: boolean;
  hasReadableAttachment: boolean;
};

/**
 * Email ingest wraps files with sender/message metadata. Only attachment text
 * may ground public article copy; an email saying what a file is about is not
 * a substitute for reading that file.
 */
export function extractGroundedMaterial(raw: string): GroundedMaterial {
  if (!raw.includes(INGEST_MARKER)) {
    return {
      text: raw.trim(),
      hasIngestMarkers: false,
      hasReadableAttachment: raw.trim().length >= 40 && !isWeakExtractedContent(raw),
    };
  }

  const attachmentSection = raw.split(INGEST_MARKER).slice(1).join(INGEST_MARKER);
  const blocks = attachmentSection.split(ATTACHMENT_MARKER).slice(1);
  const readable = blocks
    .map((block) => {
      const lines = block.split(/\r?\n/);
      const body = lines.slice(1).join("\n").trim();
      return isWeakExtractedContent(body) ? "" : body;
    })
    .filter((text) => text.length >= 40);

  return {
    text: readable.join("\n\n").trim(),
    hasIngestMarkers: true,
    hasReadableAttachment: readable.length > 0,
  };
}

function emailSubjectFromRaw(raw: string): string {
  const match = raw.match(/^Email subject:\s*(.+)$/im);
  return match?.[1]?.trim().slice(0, 120) || "Submission needs document review";
}

function unparsedSubmission(raw: string, subjectHint?: string): EnrichResult {
  const subject =
    inferSubjectFromText(raw) ??
    subjects.find((s) => s.slug === subjectHint)?.slug ??
    "general-stem";
  return {
    title: emailSubjectFromRaw(raw),
    excerpt:
      "The original file is attached, but its text could not be extracted. Review the file and add a factual summary before publishing.",
    abstract: "",
    subjectSlug: subject,
    topics: [],
    authorName: "Student contributor",
    content:
      "Document text was not extracted. Review the attached original and replace this message with verified notes before publishing.",
    provider: null,
    extractionFailed: true,
    warning:
      "No readable text was extracted from the attached document. Auto-fill was stopped to prevent invented content. Review the original file, add verified notes, then run Auto-fill again.",
  };
}

function textHasKeyword(lower: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re =
    word.length <= 4
      ? new RegExp(`\\b${escaped}s?\\b`)
      : new RegExp(`\\b${escaped}`);
  return re.test(lower);
}

function firstSentences(text: string, count: number, maxChars: number): string {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  return sentences.slice(0, count).join(" ").slice(0, maxChars).trim();
}

export function inferSubjectFromText(text: string): string | undefined {
  const lower = text.toLowerCase();
  let best: { slug: string; hits: number } | undefined;
  for (const row of SUBJECT_KEYWORDS) {
    const hits = row.words.filter((w) => textHasKeyword(lower, w)).length;
    if (hits === 0) continue;
    if (!best || hits > best.hits) best = { slug: row.slug, hits };
  }
  return best?.slug;
}

/** Drop ingest/file-type tags. Keep searchable student topics. */
export function cleanSearchTopics(raw: unknown, limit = 12): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const tag = String(item)
      .toLowerCase()
      .replace(/[_/]+/g, " ")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40);
    if (tag.length < 2 || BANNED_TOPICS.has(tag) || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= limit) break;
  }
  return out;
}

export function heuristicTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const row of SUBJECT_KEYWORDS) {
    for (const word of row.words) {
      if (textHasKeyword(lower, word) && !found.includes(word)) found.push(word);
    }
  }
  return cleanSearchTopics(found, 10);
}

function groundingTokens(text: string): Set<string> {
  const tokens = text.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [];
  return new Set(
    tokens.map((token) =>
      token.length > 4 && token.endsWith("s") ? token.slice(0, -1) : token,
    ),
  );
}

export function hasGroundingCoverage(
  generated: string,
  source: string,
  minimum = 0.35,
): boolean {
  const sourceTokens = groundingTokens(source);
  const generatedTokens = [...groundingTokens(generated)];
  if (generatedTokens.length === 0) return false;
  const supported = generatedTokens.filter((token) => sourceTokens.has(token));
  return supported.length / generatedTokens.length >= minimum;
}

function groundedTopics(raw: unknown, source: string): string[] {
  const sourceTokens = groundingTokens(source);
  return cleanSearchTopics(raw, 12).filter((topic) => {
    const tokens = [...groundingTokens(topic.replace(/-/g, " "))];
    return tokens.length > 0 && tokens.some((token) => sourceTokens.has(token));
  });
}

/** Parse model output that may wrap JSON in fences or extra prose. */
export function parseJsonObject(raw: string): Record<string, unknown> | null {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* try slice */
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function fallbackEnrich(raw: string, subjectHint?: string): EnrichResult {
  const usable = isGarbageExtractedText(raw)
    ? scannedFallback(raw)
    : raw;
  const lines = usable
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const title = lines[0]?.slice(0, 120) || "Student submission (review needed)";
  const body = lines.slice(1).join(" ") || usable;
  const excerpt =
    firstSentences(body, 2, 220) ||
    lines.slice(0, 2).join(" ").slice(0, 220) ||
    "Student notes awaiting review.";
  const abstract = firstSentences(body, 12, 1600) || usable.slice(0, 1600);
  const subject =
    inferSubjectFromText(usable) ??
    subjects.find((s) => s.slug === subjectHint)?.slug ??
    "general-stem";

  return {
    title,
    excerpt,
    abstract,
    subjectSlug: subject,
    topics: heuristicTopics(usable),
    authorName: "Student contributor",
    content: sanitizeArticleContent(raw),
    provider: null,
  };
}

function scannedFallback(raw: string): string {
  return raw.includes("Email subject:")
    ? raw.split("\n").slice(0, 6).join("\n")
    : "Student notes from an attached file. Review the original download.";
}

function withFallback(
  raw: string,
  options: { subjectHint?: string; fromName?: string } | undefined,
  warning: string,
): EnrichResult {
  const base = fallbackEnrich(raw, options?.subjectHint);
  if (options?.fromName) base.authorName = options.fromName;
  base.warning = warning;
  return base;
}

export async function enrichSubmission(
  raw: string,
  options?: { subjectHint?: string; fromName?: string },
): Promise<EnrichResult> {
  const original = raw.trim();
  const grounded = extractGroundedMaterial(original);
  if (grounded.hasIngestMarkers && !grounded.hasReadableAttachment) {
    return unparsedSubmission(original, options?.subjectHint);
  }

  const text = grounded.text || original;
  if (text.length < 20) {
    return fallbackEnrich(text, options?.subjectHint);
  }

  if (!llmConfigured()) {
    return withFallback(
      text,
      options,
      "No GROQ_API_KEY or OPENAI_API_KEY is set, so a simple text-based summary was used. Add a key in Vercel and redeploy for real AI summaries.",
    );
  }

  const subjectList = subjects.map((s) => `${s.slug} (${s.name})`).join(", ");
  const outcome = await chatCompletionDetailed(
    [
      {
        role: "system",
        content: `You prepare STEAM educational posts for Project STEAM, a student learning library for learners all over the world.
Return ONLY valid JSON (no markdown fences, no extra text) with these keys:
- title: clear short title
- subjectSlug: exactly one of [${subjectList}]. Choose from the content (biology for plants/photosynthesis, physics for forces/radioactivity, etc.)
- topics: array of 3–12 short lowercase searchable topic tags explicitly supported by the source (never tags like from-email, pdf, attachment, needs-review)
- excerpt: 2–3 line summary for cards and search (max 240 chars)
- abstract: if SOURCE MATERIAL is a substantial article or notes (more than a short email), write 10–20 lines in short paragraphs separated by blank lines covering what it teaches and the key ideas. If the source is only a few sentences, keep the abstract equally short. Never pad with invented facts.

STRICT GROUNDING RULES:
- Use only facts explicitly stated in SOURCE MATERIAL.
- Do not infer theories, examples, audience, benefits, recommendations, or learning outcomes that the source does not state.
- Do not use sender details, email wording, filenames, or submission claims as document content.
- Keep the original notes as-is. Do not invent facts.`,
      },
      {
        role: "user",
        content: `SOURCE MATERIAL:\n\n${text.slice(0, 5000)}`,
      },
    ],
    { temperature: 0, maxTokens: 1200 },
  );

  if (!outcome.ok) {
    return withFallback(
      text,
      options,
      `AI auto-fill could not run: ${outcome.errors.join(" | ")}`,
    );
  }

  const parsed = parseJsonObject(outcome.content);
  if (!parsed) {
    return withFallback(
      text,
      options,
      "The AI returned a response that was not valid JSON, so a simple summary was used. Try again.",
    );
  }

  const heuristics = fallbackEnrich(text, options?.subjectHint);

  const subjectSlug =
    inferSubjectFromText(text) ??
    subjects.find((s) => s.slug === parsed.subjectSlug)?.slug ??
    subjects.find((s) => s.slug === options?.subjectHint)?.slug ??
    "general-stem";

  const topics = groundedTopics(parsed.topics, text);
  const mergedTopics = cleanSearchTopics(
    [...topics, ...heuristics.topics],
    12,
  );
  const generatedTitle = String(parsed.title ?? "").trim();
  const generatedExcerpt = String(parsed.excerpt ?? "").trim().slice(0, 280);
  const generatedAbstract = String(parsed.abstract ?? "").trim();

  return {
    title:
      (hasGroundingCoverage(generatedTitle, text, 0.3) && generatedTitle) ||
      heuristics.title,
    excerpt:
      (hasGroundingCoverage(generatedExcerpt, text, 0.35) &&
        generatedExcerpt) ||
      heuristics.excerpt,
    abstract:
      (hasGroundingCoverage(generatedAbstract, text, 0.3) &&
        generatedAbstract) ||
      heuristics.abstract,
    subjectSlug,
    topics: mergedTopics.length > 0 ? mergedTopics : heuristics.topics,
    authorName:
      String(parsed.authorName ?? "").trim() ||
      options?.fromName ||
      "Student contributor",
    content: sanitizeArticleContent(text),
    provider: outcome.provider,
    model: outcome.model,
  };
}
