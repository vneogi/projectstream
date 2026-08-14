import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { enrichSubmission } from "@/lib/enrich";

/**
 * Admin helper: turn raw student notes (from email) into title, summary,
 * subject, topics, and cleaned content — still requires human publish.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const raw = String(body.content ?? "").trim();
  if (raw.length < 40) {
    return NextResponse.json(
      { error: "Paste at least a short article or email body first." },
      { status: 400 },
    );
  }

  const enriched = await enrichSubmission(raw);

  if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      ...enriched,
      warning:
        "No LLM key configured — used a simple fallback. Add GROQ_API_KEY for better auto-fill.",
    });
  }

  return NextResponse.json(enriched);
}
