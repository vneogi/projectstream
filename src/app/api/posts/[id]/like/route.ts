import { NextResponse } from "next/server";
import { getPostById, getPostLikeState, togglePostLike } from "@/lib/data";
import { limitOrRespond } from "@/lib/http-limit";
import { getSessionUser } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const user = await getSessionUser();
  const state = await getPostLikeState(id, user?.id);
  return NextResponse.json(state);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = limitOrRespond(request, "like", 30, 10 * 60 * 1000);
  if (limited) return limited;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to like an article" }, { status: 401 });
  }

  const { id } = await context.params;
  const post = await getPostById(id);
  if (!post || post.status !== "published") {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const result = await togglePostLike(id, user.id);
  if (!result) {
    return NextResponse.json({ error: "Could not update like" }, { status: 400 });
  }

  return NextResponse.json(result);
}
