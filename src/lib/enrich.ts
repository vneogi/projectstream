import { chatCompletion, llmConfigured } from "@/lib/llm";
import { subjects } from "@/lib/seed-data";

export type EnrichResult = {
  title: string;
  excerpt: string;
  subjectSlug: string;
  topics: string[];
  authorName: string;
  content: string;
  provider: "openai" | "groq" | null;
};

function fallbackEnrich(raw: string, subjectHint?: string): EnrichResult {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const title =
    lines[0]?.slice(0, 120) ||
    "Student submission (review needed)";
  const excerpt =
    lines.slice(0, 2).join(" ").slice(0, 220) ||
    "Email submission awaiting review.";
  const subject =
    subjects.find((s) => s.slug === subjectHint)?.slug ?? "general-stem";

  return {
    title,
    excerpt,
    subjectSlug: subject,
    topics: ["email-submission", "needs-review"],
    authorName: "Student contributor",
    content: raw.trim(),
    provider: null,
  };
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
    const base = fallbackEnrich(text, options?.subjectHint);
    if (options?.fromName) base.authorName = options.fromName;
    return base;
  }

  const subjectList = subjects.map((s) => `${s.slug} (${s.name})`).join(", ");
  const result = await chatCompletion(
    [
      {
        role: "system",
        content: `You prepare STEM educational posts for Project STEAM, a student learning library in India.
Return ONLY valid JSON with keys:
- title: clear short title
- excerpt: 1–2 sentence summary for cards and search (max 220 chars)
- subjectSlug: one of [${subjectList}]
- topics: array of 2–5 short topic tags
- authorName: best guess from the text, or "Student contributor"
- content: cleaned article body, keep facts, use short paragraphs separated by blank lines

Do not invent facts. Do not wrap JSON in markdown fences.`,
      },
      {
        role: "user",
        content: `Raw submission:\n\n${text.slice(0, 8000)}`,
      },
    ],
    { temperature: 0.2, maxTokens: 1200 },
  );

  if (!result) {
    const base = fallbackEnrich(text, options?.subjectHint);
    if (options?.fromName) base.authorName = options.fromName;
    return base;
  }

  try {
    const cleaned = result.content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const subject =
      subjects.find((s) => s.slug === parsed.subjectSlug)?.slug ??
      options?.subjectHint ??
      "general-stem";

    return {
      title: String(parsed.title ?? "").trim() || fallbackEnrich(text).title,
      excerpt: String(parsed.excerpt ?? "")
        .trim()
        .slice(0, 280) || fallbackEnrich(text).excerpt,
      subjectSlug: subjects.find((s) => s.slug === subject)?.slug ?? "general-stem",
      topics: Array.isArray(parsed.topics)
        ? parsed.topics.map((t: unknown) => String(t)).slice(0, 6)
        : ["email-submission"],
      authorName:
        String(parsed.authorName ?? "").trim() ||
        options?.fromName ||
        "Student contributor",
      content: String(parsed.content ?? text).trim(),
      provider: result.provider,
    };
  } catch {
    const base = fallbackEnrich(text, options?.subjectHint);
    if (options?.fromName) base.authorName = options.fromName;
    return base;
  }
}
