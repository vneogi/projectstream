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
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not read the article. If Content looks like random symbols, clear it, type a short overview, and try again.",
      },
      { status: 400 },
    );
  }

  const post = await updatePost(id, {
    title: body.title as string,
    slug: body.slug as string,
    excerpt: body.excerpt as string,
    abstract: body.abstract as string | undefined,
    content: body.content as string,
    subjectSlug: body.subjectSlug as string,
    topics: body.topics as string[] | undefined,
    language: body.language as string | undefined,
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
