/**
 * After Google login, `next` comes from the query string. Only allow a
 * same-site path so //evil.com or https://evil.com cannot hijack the redirect.
 */
export function safeInternalPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return "/";
  if (trimmed.startsWith("//")) return "/";
  if (trimmed.includes("\\")) return "/";
  if (trimmed.includes("://")) return "/";

  try {
    const parsed = new URL(trimmed, "https://project-steam.invalid");
    if (parsed.username || parsed.password) return "/";
    if (parsed.hostname !== "project-steam.invalid") return "/";
    const path = parsed.pathname || "/";
    return `${path}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}
