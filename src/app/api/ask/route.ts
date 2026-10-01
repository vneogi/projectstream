import { NextResponse } from "next/server";
import { listPublishedPosts, searchPublishedPosts } from "@/lib/data";
import { limitOrRespond } from "@/lib/http-limit";
import { chatCompletionDetailed, llmConfigured } from "@/lib/llm";
import type { Post } from "@/lib/types";

function sourceCard(p: Post) {
  return {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
  };
}

function fallbackAnswer(posts: Post[], usedLibraryFallback: boolean): string {
  const lead = usedLibraryFallback
    ? "I could not find a close match for that exact question, so here is the closest material from the Project STEAM library."
    : "Here is what our library says, in simple language:";

  const body = posts
    .slice(0, 2)
    .map((p) => {
      const detail = (p.abstract || p.excerpt || p.content).slice(0, 700).trim();
      return `${p.title}\n${detail}`;
    })
    .join("\n\n");

  return `${lead}\n\n${body}\n\nOpen the source articles below for the full notes.`;
}

export async function POST(request: Request) {
  const limited = limitOrRespond(request, "ask", 20, 10 * 60 * 1000);
  if (limited) return limited;

  let question: unknown;
  try {
    const body = await request.json();
    question = body.question;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const q = String(question ?? "").trim();

  if (!q) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const matched = await searchPublishedPosts(q);
  const published = matched.length > 0 ? matched : await listPublishedPosts();
  const usedLibraryFallback = matched.length === 0 && published.length > 0;
  const topSources = published.slice(0, 4);

  if (topSources.length === 0) {
    return NextResponse.json({
      answer:
        "The library does not have published articles yet. Once notes are reviewed and published in Admin, Ask AI can answer from them.",
      sources: [],
      provider: null,
    });
  }

  const contextBlock = topSources
    .map((p, i) => {
      const summary = p.abstract || p.excerpt;
      return `[${i + 1}] ${p.title}\nSubject: ${p.subjectName}\nSummary: ${summary}\n${p.content.slice(0, 1200)}`;
    })
    .join("\n\n---\n\n");

  const relevanceNote = usedLibraryFallback
    ? "These articles were the latest in the library, not necessarily a keyword match. If they do not answer the question, say so clearly and point the student to the closest topic."
    : "Prefer the articles that most directly answer the question.";

  if (llmConfigured()) {
    const outcome = await chatCompletionDetailed(
      [
        {
          role: "system",
          content:
            "You are a helpful STEM tutor for Indian school students (Class 8–12). Answer using the provided Project STEAM library articles. Write 2–4 short paragraphs in simple language. If the articles do not contain enough information, say what is missing. End with a short line listing which source titles you used.",
        },
        {
          role: "user",
          content: `Question: ${q}\n\n${relevanceNote}\n\nLibrary articles:\n${contextBlock}`,
        },
      ],
      { temperature: 0.2, maxTokens: 900 },
    );

    if (outcome.ok) {
      return NextResponse.json({
        answer: outcome.content,
        provider: outcome.provider,
        sources: topSources.map(sourceCard),
      });
    }

    console.error("Ask AI LLM failed:", outcome.errors.join(" | "));
  }

  return NextResponse.json({
    answer: fallbackAnswer(topSources, usedLibraryFallback),
    provider: null,
    sources: topSources.map(sourceCard),
  });
}
