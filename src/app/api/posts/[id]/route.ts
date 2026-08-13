import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { updatePost } from "@/lib/data";
import type { PostStatus } from "@/lib/types";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();

  const post = await updatePost(id, {
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt,
    content: body.content,
    subjectSlug: body.subjectSlug,
    topics: body.topics,
    authorName: body.authorName,
    authorSchool: body.authorSchool,
    language: body.language,
    status: body.status as PostStatus,
  });

  if (!post) {
    return NextResponse.json({ error: "Could not update post" }, { status: 400 });
  }

  return NextResponse.json(post);
}
