import { cookies } from "next/headers";
import {
  adminCookieName,
  isValidAdminCookie,
} from "./admin-session";

export {
  adminCookieName,
  ADMIN_COOKIE_MAX_AGE_SEC,
  createAdminCookieValue,
  getAdminPassword,
  isPlaceholderAdminPassword,
  isVercelRuntime,
  verifyAdminPassword,
} from "./admin-session";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidAdminCookie(cookieStore.get(adminCookieName)?.value);
}
