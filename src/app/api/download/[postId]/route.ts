import { NextResponse } from "next/server";
import { getPostById } from "@/lib/data";
import { getSessionUser } from "@/lib/supabase/server";
import { getSupabaseAdmin, MATERIALS_BUCKET } from "@/lib/supabase/admin";

/**
 * Authenticated download of the original PDF/PPTX.
 * Anonymous users get 401 → client sends them to /auth/login.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ postId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required to download materials" },
      { status: 401 },
    );
  }

  const { postId } = await context.params;
  const post = await getPostById(postId);

  if (!post || post.status !== "published") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!post.filePath) {
    return NextResponse.json(
      { error: "No downloadable file for this article yet" },
      { status: 404 },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { data, error } = await admin.storage
    .from(MATERIALS_BUCKET)
    .createSignedUrl(post.filePath, 60, {
      download: post.fileName || undefined,
    });

  if (error || !data?.signedUrl) {
    console.error("signed URL failed", error?.message);
    return NextResponse.json({ error: "Could not create download link" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
