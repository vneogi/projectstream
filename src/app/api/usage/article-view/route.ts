import { NextResponse } from "next/server";
import { getPostById } from "@/lib/data";
import { limitOrRespond } from "@/lib/http-limit";
import { getSessionUser } from "@/lib/supabase/server";
import { recordUsageEvent } from "@/lib/usage";

export async function POST(request: Request) {
  const limited = limitOrRespond(request, "article-view", 120, 10 * 60 * 1000);
  if (limited) return limited;

  let postId = "";
  try {
    const body = await request.json();
    postId = String(body.postId ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const post = await getPostById(postId);
  if (!post || post.status !== "published") {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const user = await getSessionUser();
  await recordUsageEvent(request, {
    eventType: "article_view",
    postId,
    userId: user?.id,
    resultCount: 1,
  });
  return NextResponse.json({ ok: true });
}

