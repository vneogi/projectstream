import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { chatCompletion, llmConfigured } from "@/lib/llm";
import { subjects } from "@/lib/seed-data";

/**
 * Admin helper: turn raw student notes (from email) into title, summary,
 * subject, topics, and cleaned content — still requires human publish.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!llmConfigured()) {
    return NextResponse.json(
      {
        error:
          "No LLM key configured. Add GROQ_API_KEY (free) or OPENAI_API_KEY in Vercel env vars.",
      },
      { status: 400 },
    );
  }

  const body = await request.json();
  const raw = String(body.content ?? "").trim();
  if (raw.length < 40) {
    return NextResponse.json(
      { error: "Paste at least a short article or email body first." },
      { status: 400 },
    );
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
        content: `Raw submission:\n\n${raw.slice(0, 8000)}`,
      },
    ],
    { temperature: 0.2, maxTokens: 1200 },
  );

  if (!result) {
    return NextResponse.json(
      { error: "LLM request failed. Try again in a moment." },
      { status: 502 },
    );
  }

  try {
    const cleaned = result.content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const subject = subjects.find((s) => s.slug === parsed.subjectSlug);

    return NextResponse.json({
      title: String(parsed.title ?? "").trim(),
      excerpt: String(parsed.excerpt ?? "").trim().slice(0, 280),
      subjectSlug: subject?.slug ?? "general-stem",
      topics: Array.isArray(parsed.topics)
        ? parsed.topics.map((t: unknown) => String(t)).slice(0, 6)
        : [],
      authorName: String(parsed.authorName ?? "Student contributor").trim(),
      content: String(parsed.content ?? raw).trim(),
      provider: result.provider,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not parse AI response. Try again." },
      { status: 502 },
    );
  }
}
