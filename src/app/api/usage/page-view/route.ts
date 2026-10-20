import { NextResponse } from "next/server";
import { limitOrRespond } from "@/lib/http-limit";
import { safeInternalPath } from "@/lib/safe-path";
import { getSessionUser } from "@/lib/supabase/server";
import { recordUsageEvent } from "@/lib/usage";

export async function POST(request: Request) {
  const limited = limitOrRespond(request, "page-view", 240, 10 * 60 * 1000);
  if (limited) return limited;

  let path = "/";
  try {
    const body = await request.json();
    path = safeInternalPath(String(body.path ?? "/"));
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await getSessionUser();
  await recordUsageEvent(request, {
    eventType: "page_view",
    userId: user?.id,
    resultCount: 1,
    metadata: { path: path.slice(0, 200) },
  });
  return NextResponse.json({ ok: true });
}

