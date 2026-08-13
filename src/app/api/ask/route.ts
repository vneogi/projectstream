import { NextResponse } from "next/server";
import { searchPublishedPosts } from "@/lib/data";

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
    });
  }

  const contextBlock = topSources
    .map(
      (p, i) =>
        `[${i + 1}] ${p.title}\n${p.excerpt}\n${p.content.slice(0, 800)}`,
    )
    .join("\n\n---\n\n");

  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful STEM tutor for Indian school students. Answer ONLY using the provided library articles. If the articles do not contain enough information, say so clearly. Use simple language. Mention which source titles you used.",
            },
            {
              role: "user",
              content: `Question: ${q}\n\nLibrary articles:\n${contextBlock}`,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const answer = data.choices?.[0]?.message?.content ?? "";
        return NextResponse.json({
          answer,
          sources: topSources.map((p) => ({
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
          })),
        });
      }
    } catch {
      // fall through to local summary
    }
  }

  const answer = `Based on our library, start with "${topSources[0].title}". ${topSources[0].excerpt}${
    topSources.length > 1
      ? ` You may also read "${topSources[1].title}" for more detail.`
      : ""
  } Open the linked articles below for the full explanation.`;

  return NextResponse.json({
    answer,
    sources: topSources.map((p) => ({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
    })),
  });
}
