import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createPost } from "@/lib/data";
import type { PostStatus } from "@/lib/types";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const post = await createPost({
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt,
    abstract: body.abstract,
    content: body.content,
    subjectSlug: body.subjectSlug,
    topics: body.topics ?? [],
    authorName: body.authorName,
    authorSchool: body.authorSchool,
    language: body.language ?? "en",
    status: body.status as PostStatus,
  });

  if (!post) {
    return NextResponse.json({ error: "Could not create post" }, { status: 400 });
  }

  return NextResponse.json(post);
}
