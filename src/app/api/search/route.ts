import { NextResponse } from "next/server";
import { searchPublishedPosts } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const posts = await searchPublishedPosts(q);
  // Public API: never return full body — only summary fields
  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      subjectName: p.subjectName,
      subjectSlug: p.subjectSlug,
      topics: p.topics,
      authorName: p.authorName,
      hasFile: Boolean(p.filePath),
      createdAt: p.createdAt,
    })),
    total: posts.length,
    query: q,
  });
}
