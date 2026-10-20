import { NextResponse } from "next/server";
import { listPublishedPosts } from "@/lib/data";
import { limitOrRespond } from "@/lib/http-limit";
import {
  rankPostsForAsk,
  suggestPostsForQuery,
} from "@/lib/library-search";
import { chatCompletionDetailed, llmConfigured } from "@/lib/llm";
import type { Post } from "@/lib/types";
import { recordUsageEvent } from "@/lib/usage";

function sourceCard(p: Post) {
  return {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
  };
}

const NO_MATCH_ANSWER =
  "Project STEAM has not yet published articles on this topic. Below are some similar topics for you to explore.";

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

  const published = await listPublishedPosts();
  const topSources = rankPostsForAsk(published, q).slice(0, 4);

  if (topSources.length === 0) {
    const suggestions = suggestPostsForQuery(published, q);
    await recordUsageEvent(request, {
      eventType: "ask",
      queryText: q,
      resultCount: 0,
      metadata: { suggestion_count: suggestions.length },
    });
    return NextResponse.json({
      answer: NO_MATCH_ANSWER,
      sources: suggestions.map(sourceCard),
      provider: null,
      suggested: true,
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
            "You are an intelligent, grounded STEAM tutor. Collate and consolidate useful knowledge across ALL relevant provided Project STEAM articles. Use ONLY facts present in those articles. Explain connections or differences between sources when helpful. Attribute facts inline with natural wording such as: In “Article Title,” we explore... or “Article Title” explains.... Do not invent website menus, URLs, buttons, facts, or how-to steps. If the provided articles do not actually answer the question, say: Project STEAM has not yet published articles on this topic. Do not add a separate Sources used list because source cards appear below.",
        },
        {
          role: "user",
          content: `Question: ${q}\n\nLibrary articles:\n${contextBlock}`,
        },
      ],
      { temperature: 0.2, maxTokens: 900 },
    );

    if (outcome.ok) {
      if (
        outcome.content
          .toLowerCase()
          .includes("project steam has not yet published articles on this topic")
      ) {
        const suggestions = suggestPostsForQuery(published, q);
        await recordUsageEvent(request, {
          eventType: "ask",
          queryText: q,
          resultCount: 0,
          metadata: {
            provider: outcome.provider,
            suggestion_count: suggestions.length,
          },
        });
        return NextResponse.json({
          answer: NO_MATCH_ANSWER,
          provider: outcome.provider,
          sources: suggestions.map(sourceCard),
          suggested: true,
        });
      }

      await recordUsageEvent(request, {
        eventType: "ask",
        queryText: q,
        resultCount: topSources.length,
        metadata: { provider: outcome.provider },
      });
      return NextResponse.json({
        answer: outcome.content,
        provider: outcome.provider,
        sources: topSources.map(sourceCard),
        suggested: false,
      });
    }

    console.error("Ask AI LLM failed:", outcome.errors.join(" | "));
  }

  await recordUsageEvent(request, {
    eventType: "ask",
    queryText: q,
    resultCount: topSources.length,
    metadata: { provider: "fallback" },
  });
  return NextResponse.json({
    answer: fallbackAnswer(topSources),
    provider: null,
    sources: topSources.map(sourceCard),
    suggested: false,
  });
}
