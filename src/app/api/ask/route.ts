import { NextResponse } from "next/server";
import { searchPublishedPosts } from "@/lib/data";
import { limitOrRespond } from "@/lib/http-limit";
import { askTopicTokens } from "@/lib/library-search";
import { chatCompletionDetailed, llmConfigured } from "@/lib/llm";
import type { Post } from "@/lib/types";

function sourceCard(p: Post) {
  return {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
  };
}

const NO_MATCH_ANSWER =
  "I can only answer from published Project STEAM articles. The library does not have an article that explains that yet. Try Browse or Search for a topic such as photosynthesis, DNA, or a quiz title, or open Share your work if you want to contribute notes.";

function fallbackAnswer(posts: Post[]): string {
  const body = posts
    .slice(0, 2)
    .map((p) => {
      const detail = (p.abstract || p.excerpt || p.content).slice(0, 700).trim();
      return `${p.title}\n${detail}`;
    })
    .join("\n\n");

  return `Here is what our library says, in simple language:\n\n${body}\n\nOpen the source articles below for the full notes.`;
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
  const topicTokens = askTopicTokens(q);
  const topSources =
    topicTokens.length === 0 ? [] : matched.slice(0, 4);

  if (topSources.length === 0) {
    return NextResponse.json({
      answer: NO_MATCH_ANSWER,
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

  if (llmConfigured()) {
    const outcome = await chatCompletionDetailed(
      [
        {
          role: "system",
          content:
            "You are a STEAM tutor who may use ONLY the provided Project STEAM library articles. Write 2–4 short paragraphs in simple language. Do not invent website menus, URLs, buttons, or how-to steps that the articles do not state. If the articles do not answer the question, say so in one or two sentences and do not guess. End with a short line listing only the source titles you actually used.",
        },
        {
          role: "user",
          content: `Question: ${q}\n\nLibrary articles:\n${contextBlock}`,
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
    answer: fallbackAnswer(topSources),
    provider: null,
    sources: topSources.map(sourceCard),
  });
}
