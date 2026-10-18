import { chatCompletionDetailed, llmConfigured } from "./llm";
import { isGarbageExtractedText, sanitizeArticleContent } from "./extract-text";
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
];

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
    subjects.find((s) => s.slug === subjectHint)?.slug ??
    inferSubjectFromText(usable) ??
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
  const text = raw.trim();
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
- topics: array of 6–12 short lowercase searchable topic tags about the science (never tags like from-email, pdf, attachment, needs-review)
- excerpt: 2–3 line summary for cards and search (max 240 chars)
- abstract: a 10–20 line overview a student can read before downloading. Cover what the material teaches, the key ideas, and who it helps. Use short paragraphs separated by blank lines.

Keep the original notes as-is. Do not invent facts.`,
      },
      {
        role: "user",
        content: `Raw submission:\n\n${text.slice(0, 5000)}`,
      },
    ],
    { temperature: 0.2, maxTokens: 900 },
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
    subjects.find((s) => s.slug === parsed.subjectSlug)?.slug ??
    subjects.find((s) => s.slug === options?.subjectHint)?.slug ??
    inferSubjectFromText(text) ??
    "general-stem";

  const topics = cleanSearchTopics(parsed.topics, 12);
  const mergedTopics = cleanSearchTopics(
    [...topics, ...heuristics.topics],
    12,
  );

  return {
    title: String(parsed.title ?? "").trim() || heuristics.title,
    excerpt:
      String(parsed.excerpt ?? "").trim().slice(0, 280) || heuristics.excerpt,
    abstract: String(parsed.abstract ?? "").trim() || heuristics.abstract,
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
