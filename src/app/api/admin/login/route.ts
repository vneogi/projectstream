import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_MAX_AGE_SEC,
  adminCookieName,
  createAdminCookieValue,
  isPlaceholderAdminPassword,
  isVercelRuntime,
  verifyAdminPassword,
} from "@/lib/auth";
import { limitOrRespond } from "@/lib/http-limit";

export async function POST(request: Request) {
  const limited = limitOrRespond(request, "admin-login", 8, 15 * 60 * 1000);
  if (limited) return limited;

  if (isVercelRuntime() && isPlaceholderAdminPassword()) {
    return NextResponse.json(
      {
        error:
          "Set a strong ADMIN_PASSWORD in Vercel → Environment Variables (Production), then redeploy. The default password is disabled on the live site.",
      },
      { status: 503 },
    );
  }

  let password = "";
  try {
    const body = await request.json();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, createAdminCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE_SEC,
  });
  return response;
}
