import { NextResponse } from "next/server";
import { searchPublishedPosts } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const posts = await searchPublishedPosts(q);
  return NextResponse.json({ posts, total: posts.length, query: q });
}
