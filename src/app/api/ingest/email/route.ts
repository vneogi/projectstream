import { NextResponse } from "next/server";
import {
  createPost,
  findPostBySourceMessageId,
  hasDatabase,
} from "@/lib/data";
import { enrichSubmission } from "@/lib/enrich";
import { slugify, verifyIngestSecret } from "@/lib/security";

/**
 * Gmail Apps Script webhook.
 * ALWAYS creates drafts only — never publishes.
 *
 * Auth: Authorization: Bearer <INGEST_SECRET>
 * or header x-ingest-secret: <INGEST_SECRET>
 */
export async function POST(request: Request) {
  const auth =
    request.headers.get("authorization") ??
    request.headers.get("x-ingest-secret");

  if (!verifyIngestSecret(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Email ingest needs a database so drafts persist. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.",
      },
      { status: 503 },
    );
  }

  if (!process.env.INGEST_SECRET) {
    return NextResponse.json(
      { error: "INGEST_SECRET is not set on the server." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messageId = String(body.messageId ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const from = String(body.from ?? "").trim();
  const fromName = String(body.fromName ?? "").trim();
  const plainBody = String(body.body ?? body.plainBody ?? "").trim();
  const receivedAt = String(body.receivedAt ?? "").trim();

  if (!messageId) {
    return NextResponse.json({ error: "messageId is required" }, { status: 400 });
  }
  if (plainBody.length < 20 && subject.length < 5) {
    return NextResponse.json(
      { error: "Email body is too short to ingest" },
      { status: 400 },
    );
  }

  const existing = await findPostBySourceMessageId(messageId);
  if (existing) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      postId: existing.id,
      status: existing.status,
      message: "Already ingested — skipped",
    });
  }

  const raw = [
    subject ? `Email subject: ${subject}` : "",
    from ? `From: ${from}` : "",
    receivedAt ? `Received: ${receivedAt}` : "",
    "",
    plainBody || subject,
  ]
    .filter(Boolean)
    .join("\n");

  const enriched = await enrichSubmission(raw, {
    fromName: fromName || undefined,
  });

  // Prefer email subject if enrichment title is too generic
  const title =
    enriched.title && !enriched.title.toLowerCase().includes("review needed")
      ? enriched.title
      : subject || enriched.title;

  const baseSlug = slugify(title) || `email-${Date.now()}`;
  const uniqueSlug = `${baseSlug}-${messageId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase()}`;

  const post = await createPost({
    title,
    slug: uniqueSlug,
    excerpt: enriched.excerpt,
    content: enriched.content,
    subjectSlug: enriched.subjectSlug,
    topics: Array.from(
      new Set(["from-email", ...enriched.topics].map((t) => t.toLowerCase())),
    ),
    authorName: enriched.authorName || fromName || "Student contributor",
    language: "en",
    // Hard rule: email ingest never publishes
    status: "draft",
    sourceMessageId: messageId,
    sourceFrom: from || undefined,
  });

  if (!post) {
    return NextResponse.json(
      { error: "Failed to create draft. Check Supabase schema includes source_message_id." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    duplicate: false,
    postId: post.id,
    status: post.status,
    title: post.title,
    subjectSlug: post.subjectSlug,
    enrichedWith: enriched.provider,
    message: "Draft created — review in /admin before publishing",
  });
}

export async function GET() {
  return NextResponse.json({
    service: "Project STEAM email ingest",
    publishes: false,
    requires: ["INGEST_SECRET", "Supabase"],
    docs: "/docs in repo: gmail/README.md",
  });
}
