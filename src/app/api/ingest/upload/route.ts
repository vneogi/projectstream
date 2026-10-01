import { NextResponse } from "next/server";
import {
  findPostBySourceMessageId,
  getPostById,
} from "@/lib/data";
import { isAllowedMaterial } from "@/lib/file-types";
import { limitOrRespond } from "@/lib/http-limit";
import { verifyIngestSecret } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { storePostMaterial } from "@/lib/store-material";

export const runtime = "nodejs";

/**
 * Gmail Apps Script uploads original study files here (draft-only posts).
 * Auth: Authorization: Bearer <INGEST_SECRET>
 *
 * Form fields:
 *  - file: binary
 *  - messageId: Gmail message id (preferred)
 *  - postId: optional if messageId not used
 */
export async function POST(request: Request) {
  const limited = limitOrRespond(request, "ingest-upload", 60, 10 * 60 * 1000);
  if (limited) return limited;

  const auth =
    request.headers.get("authorization") ??
    request.headers.get("x-ingest-secret");

  if (!verifyIngestSecret(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getSupabaseAdmin()) {
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

  if (!isAllowedMaterial(file.name, file.type)) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Attach PDF, Word, slides, spreadsheet, or an image (PNG/JPG/GIF/WebP).",
      },
      { status: 415 },
    );
  }

  // Vercel body limit ~4.5MB — keep a margin
  const maxBytes = 3.5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        error:
          "File too large for automatic upload (>3.5MB). Compress the file or upload a smaller copy.",
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storePostMaterial(post, file, buffer);
  if (!stored.ok) {
    return NextResponse.json({ error: stored.error }, { status: stored.status });
  }

  const updated = await getPostById(post.id);

  return NextResponse.json({
    ok: true,
    postId: post.id,
    filePath: stored.path,
    fileName: file.name,
    status: updated?.status ?? post.status,
    message: "File stored privately — download requires student login",
  });
}
