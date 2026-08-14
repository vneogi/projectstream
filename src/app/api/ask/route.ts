import { NextResponse } from "next/server";
import { searchPublishedPosts } from "@/lib/data";
import { chatCompletion, llmConfigured } from "@/lib/llm";

export async function POST(request: Request) {
  const { question } = await request.json();
  const q = String(question ?? "").trim();

  if (!q) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const sources = await searchPublishedPosts(q);
  const topSources = sources.slice(0, 4);

  if (topSources.length === 0) {
    return NextResponse.json({
      answer:
        "I couldn't find published articles on this topic yet. Try searching the library or submit content so we can add it.",
      sources: [],
      provider: null,
    });
  }

  const contextBlock = topSources
    .map(
      (p, i) =>
        `[${i + 1}] ${p.title}\nSummary: ${p.excerpt}\n${p.content.slice(0, 1200)}`,
    )
    .join("\n\n---\n\n");

  if (llmConfigured()) {
    const result = await chatCompletion([
      {
        role: "system",
        content:
          "You are a helpful STEM tutor for Indian school students (Class 8–12). Answer ONLY using the provided Project STEAM library articles. If the articles do not contain enough information, say so clearly. Use simple language. End with a short line listing which source titles you used.",
      },
      {
        role: "user",
        content: `Question: ${q}\n\nLibrary articles:\n${contextBlock}`,
      },
    ]);

    if (result) {
      return NextResponse.json({
        answer: result.content,
        provider: result.provider,
        sources: topSources.map((p) => ({
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
        })),
      });
    }
  }

  const answer = `Based on our library, start with "${topSources[0].title}". ${topSources[0].excerpt}${
    topSources.length > 1
      ? ` You may also read "${topSources[1].title}" for more detail.`
      : ""
  } Open the linked articles below for the full explanation.${
    !llmConfigured()
      ? " (Tip for editors: add GROQ_API_KEY or OPENAI_API_KEY in Vercel to enable live AI answers.)"
      : ""
  }`;

  return NextResponse.json({
    answer,
    provider: null,
    sources: topSources.map((p) => ({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
    })),
  });
}
