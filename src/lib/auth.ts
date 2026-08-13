import { cookies } from "next/headers";

const COOKIE_NAME = "project_steam_admin";
const COOKIE_VALUE = "authenticated";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "change-me-before-deploy";
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}

export function verifyAdminPassword(password: string): boolean {
  return password === getAdminPassword();
}

export const adminCookieName = COOKIE_NAME;
export const adminCookieValue = COOKIE_VALUE;
