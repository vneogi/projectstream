import { createHmac, timingSafeEqual } from "node:crypto";

export const adminCookieName = "project_steam_admin";
export const ADMIN_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;
export const PLACEHOLDER_ADMIN_PASSWORD = "change-me-before-deploy";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? PLACEHOLDER_ADMIN_PASSWORD;
}

export function isPlaceholderAdminPassword(): boolean {
  return getAdminPassword() === PLACEHOLDER_ADMIN_PASSWORD;
}

/** True when this process is a Vercel deployment (production or preview). */
export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

function signingSecret(): string {
  return `project-steam-admin:${getAdminPassword()}`;
}

export function verifyAdminPassword(password: string): boolean {
  if (!password) return false;
  if (isVercelRuntime() && isPlaceholderAdminPassword()) return false;
  return password === getAdminPassword();
}

export function createAdminCookieValue(): string {
  const exp = Date.now() + ADMIN_COOKIE_MAX_AGE_SEC * 1000;
  const payload = `v1.${exp}`;
  const sig = createHmac("sha256", signingSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function isValidAdminCookie(value: string | undefined | null): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [version, expRaw, sig] = parts;
  if (version !== "v1" || !expRaw || !sig) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;

  const payload = `${version}.${expRaw}`;
  const expected = createHmac("sha256", signingSecret())
    .update(payload)
    .digest("hex");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
