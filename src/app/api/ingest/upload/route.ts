import { NextResponse } from "next/server";
import {
  findPostBySourceMessageId,
  getPostById,
  updatePost,
} from "@/lib/data";
import { verifyIngestSecret } from "@/lib/security";
import { getSupabaseAdmin, MATERIALS_BUCKET } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Gmail Apps Script uploads original PDF/PPTX here (draft-only posts).
 * Auth: Authorization: Bearer <INGEST_SECRET>
 *
 * Form fields:
 *  - file: binary
 *  - messageId: Gmail message id (preferred)
 *  - postId: optional if messageId not used
 */
export async function POST(request: Request) {
  const auth =
    request.headers.get("authorization") ??
    request.headers.get("x-ingest-secret");

  if (!verifyIngestSecret(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  const messageId = String(form.get("messageId") ?? "").trim();
  const postId = String(form.get("postId") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  // Vercel body limit ~4.5MB — keep a margin
  const maxBytes = 3.5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        error:
          "File too large for automatic upload (>3.5MB). Compress the PDF or upload manually in Admin.",
        maxBytes,
      },
      { status: 413 },
    );
  }

  let post = null;
  if (messageId) post = await findPostBySourceMessageId(messageId);
  if (!post && postId) post = await getPostById(postId);

  if (!post) {
    return NextResponse.json(
      {
        error:
          "Post not found. Call /api/ingest/email first to create the draft, then upload the file.",
      },
      { status: 404 },
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const path = `${post.id}/${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(MATERIALS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    console.error("upload failed", uploadError.message);
    return NextResponse.json(
      {
        error:
          "Storage upload failed. Create a private bucket named `materials` in Supabase Storage.",
        detail: uploadError.message,
      },
      { status: 500 },
    );
  }

  const updated = await updatePost(post.id, {
    filePath: path,
    fileName: file.name,
    fileMime: file.type || "application/octet-stream",
    fileSize: file.size,
  });

  return NextResponse.json({
    ok: true,
    postId: post.id,
    filePath: path,
    fileName: file.name,
    status: updated?.status ?? post.status,
    message: "File stored privately — download requires student login",
  });
}
