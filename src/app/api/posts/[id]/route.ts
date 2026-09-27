import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { deletePost, getPostById, updatePost } from "@/lib/data";
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
    abstract: body.abstract,
    content: body.content,
    subjectSlug: body.subjectSlug,
    topics: body.topics,
    language: body.language,
    status: body.status as PostStatus,
  });

  if (!post) {
    return NextResponse.json({ error: "Could not update post" }, { status: 400 });
  }

  return NextResponse.json(post);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const post = await getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
  if (post.status !== "draft") {
    return NextResponse.json(
      { error: "Only drafts can be deleted. Unpublish the article first." },
      { status: 409 },
    );
  }

  const deleted = await deletePost(id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Could not delete article" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
