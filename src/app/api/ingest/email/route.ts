import { NextResponse } from "next/server";
import {
  createPost,
  findPostBySourceMessageId,
  hasDatabase,
} from "@/lib/data";
import { enrichSubmission } from "@/lib/enrich";
import { slugify, verifyIngestSecret } from "@/lib/security";

type IngestAttachment = {
  name?: string;
  type?: string;
  mimeType?: string;
  text?: string;
  sourceUrl?: string;
};

/**
 * Gmail Apps Script webhook.
 * ALWAYS creates drafts only — never publishes.
 *
 * Accepts email body + extracted attachment text (PDF / PPTX / Google Slides).
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
  const attachments = Array.isArray(body.attachments)
    ? (body.attachments as IngestAttachment[])
    : [];

  if (!messageId) {
    return NextResponse.json({ error: "messageId is required" }, { status: 400 });
  }

  const attachmentBlocks = attachments
    .map((att) => {
      const text = String(att.text ?? "").trim();
      if (text.length < 20) return "";
      const name = String(att.name ?? "attachment");
      const type = String(att.type ?? "file");
      const url = att.sourceUrl ? `\nSource: ${att.sourceUrl}` : "";
      return `### Attachment (${type}): ${name}${url}\n\n${text.slice(0, 40000)}`;
    })
    .filter(Boolean);

  const combinedAttachmentText = attachmentBlocks.join("\n\n");
  const hasBody = plainBody.replace(/\s+/g, "").length >= 20;
  const hasAttachments = combinedAttachmentText.length >= 40;

  // A submission must carry study material. Plain replies on a thread are
  // conversation, not content, and must never become drafts.
  if (attachments.length === 0) {
    return NextResponse.json(
      {
        error:
          "Skipped — a submission needs a PDF/PPTX/DOCX attachment or a Google Slides/Docs link. Plain emails and replies are ignored.",
        skipped: true,
      },
      { status: 400 },
    );
  }

  if (!hasBody && !hasAttachments && subject.length < 5) {
    return NextResponse.json(
      {
        error:
          "Nothing to ingest — email body and attachments had too little extractable text (scanned image PDFs need OCR).",
      },
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
    attachments.length
      ? `Attachments processed: ${attachments.length}`
      : "",
    "",
    hasBody ? `## Email message\n\n${plainBody.slice(0, 20000)}` : "",
    hasAttachments ? `## Extracted files\n\n${combinedAttachmentText}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 90000);

  const enriched = await enrichSubmission(raw, {
    fromName: fromName || undefined,
  });

  const title =
    enriched.title && !enriched.title.toLowerCase().includes("review needed")
      ? enriched.title
      : subject || enriched.title;

  const baseSlug = slugify(title) || `email-${Date.now()}`;
  const uniqueSlug = `${baseSlug}-${messageId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase()}`;

  const topics = Array.from(
    new Set(
      [
        "from-email",
        ...attachments.map((a) => String(a.type ?? "").toLowerCase()).filter(Boolean),
        ...enriched.topics,
      ].map((t) => t.toLowerCase()),
    ),
  );

  const post = await createPost({
    title,
    slug: uniqueSlug,
    excerpt: enriched.excerpt,
    abstract: enriched.abstract,
    content: enriched.content,
    subjectSlug: enriched.subjectSlug,
    topics,
    authorName: enriched.authorName || fromName || "Student contributor",
    language: "en",
    // Hard rule: email ingest never publishes
    status: "draft",
    sourceMessageId: messageId,
    sourceFrom: from || undefined,
  });

  if (!post) {
    return NextResponse.json(
      {
        error:
          "Failed to create draft. Check Supabase schema includes source_message_id.",
      },
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
    attachmentsUsed: attachmentBlocks.length,
    enrichedWith: enriched.provider,
    enrichWarning: enriched.warning,
    message: "Draft created — review in /admin before publishing",
  });
}

export async function GET() {
  return NextResponse.json({
    service: "Project STEAM email ingest",
    publishes: false,
    supports: ["email body", "pdf", "pptx", "docx", "google slides/docs links"],
    requires: ["INGEST_SECRET", "Supabase"],
    docs: "gmail/README.md",
  });
}
