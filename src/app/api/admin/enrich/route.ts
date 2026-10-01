import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { enrichSubmission } from "@/lib/enrich";
import { limitOrRespond } from "@/lib/http-limit";

/**
 * Admin helper: turn raw student notes (from email) into title, author,
 * subject, topics, summary, and abstract — still requires human publish.
 */
export async function POST(request: Request) {
  const limited = limitOrRespond(request, "enrich", 20, 10 * 60 * 1000);
  if (limited) return limited;

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

  const enriched = await enrichSubmission(raw, {
    fromName: body.fromName ? String(body.fromName) : undefined,
    subjectHint: body.subjectHint ? String(body.subjectHint) : undefined,
  });

  return NextResponse.json(enriched);
}
