import type { Post } from "./types";
import { updatePost } from "./data";
import { getSupabaseAdmin, MATERIALS_BUCKET } from "./supabase/admin";

const MAX_BYTES = 3.5 * 1024 * 1024;

export function materialSizeLimit(): number {
  return MAX_BYTES;
}

export async function storePostMaterial(
  post: Post,
  file: { name: string; type: string; size: number },
  buffer: Buffer,
): Promise<{ ok: true; path: string } | { ok: false; status: number; error: string }> {
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      status: 413,
      error:
        "File too large for automatic upload (>3.5MB). Compress it or use a smaller copy.",
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, status: 503, error: "Supabase is not configured" };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const path = `${post.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await admin.storage
    .from(MATERIALS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    return {
      ok: false,
      status: 500,
      error:
        "Storage upload failed. Create a private bucket named `materials` in Supabase Storage.",
    };
  }

  if (post.filePath && post.filePath !== path) {
    await admin.storage.from(MATERIALS_BUCKET).remove([post.filePath]);
  }

  const updated = await updatePost(post.id, {
    filePath: path,
    fileName: file.name,
    fileMime: file.type || "application/octet-stream",
    fileSize: file.size,
  });

  if (!updated) {
    return {
      ok: false,
      status: 500,
      error: "File uploaded but the article record did not update.",
    };
  }

  return { ok: true, path };
}
