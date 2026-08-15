import { chatCompletionDetailed, llmConfigured } from "./llm";
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

function firstSentences(text: string, count: number, maxChars: number): string {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  return sentences.slice(0, count).join(" ").slice(0, maxChars).trim();
}

function fallbackEnrich(raw: string, subjectHint?: string): EnrichResult {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const title = lines[0]?.slice(0, 120) || "Student submission (review needed)";
  const body = lines.slice(1).join(" ") || raw;
  const excerpt =
    firstSentences(body, 2, 220) ||
    lines.slice(0, 2).join(" ").slice(0, 220) ||
    "Email submission awaiting review.";
  const abstract = firstSentences(body, 12, 1600) || raw.slice(0, 1600);
  const subject =
    subjects.find((s) => s.slug === subjectHint)?.slug ?? "general-stem";

  return {
    title,
    excerpt,
    abstract,
    subjectSlug: subject,
    topics: ["email-submission", "needs-review"],
    authorName: "Student contributor",
    content: raw.trim(),
    provider: null,
  };
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
        content: `You prepare STEM educational posts for Project STEAM, a student learning library in India.
Return ONLY valid JSON with these keys:
- title: clear short title
- authorName: the student author's name if the text states one, else "Student contributor"
- subjectSlug: exactly one of [${subjectList}]
- topics: array of 2–5 short lowercase topic tags
- excerpt: 2–3 line summary for cards and search (max 240 chars)
- abstract: a 10–20 line overview a student can read before downloading. Cover what the material teaches, the key ideas, and who it helps. Use short paragraphs separated by blank lines.
- content: cleaned full notes, keep facts, short paragraphs separated by blank lines

Do not invent facts. Do not wrap JSON in markdown fences.`,
      },
      {
        role: "user",
        content: `Raw submission:\n\n${text.slice(0, 12000)}`,
      },
    ],
    { temperature: 0.2, maxTokens: 2200 },
  );

  if (!outcome.ok) {
    return withFallback(
      text,
      options,
      `AI auto-fill could not run: ${outcome.errors.join(" | ")}`,
    );
  }

  try {
    const cleaned = outcome.content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const heuristics = fallbackEnrich(text, options?.subjectHint);

    const subjectSlug =
      subjects.find((s) => s.slug === parsed.subjectSlug)?.slug ??
      subjects.find((s) => s.slug === options?.subjectHint)?.slug ??
      "general-stem";

    return {
      title: String(parsed.title ?? "").trim() || heuristics.title,
      excerpt:
        String(parsed.excerpt ?? "").trim().slice(0, 280) ||
        heuristics.excerpt,
      abstract:
        String(parsed.abstract ?? "").trim() || heuristics.abstract,
      subjectSlug,
      topics: Array.isArray(parsed.topics)
        ? parsed.topics.map((t: unknown) => String(t).toLowerCase()).slice(0, 6)
        : ["email-submission"],
      authorName:
        String(parsed.authorName ?? "").trim() ||
        options?.fromName ||
        "Student contributor",
      content: String(parsed.content ?? text).trim(),
      provider: outcome.provider,
      model: outcome.model,
    };
  } catch {
    return withFallback(
      text,
      options,
      "The AI returned a response that was not valid JSON, so a simple summary was used. Try again.",
    );
  }
}
