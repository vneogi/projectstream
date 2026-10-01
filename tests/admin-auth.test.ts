import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  PLACEHOLDER_ADMIN_PASSWORD,
  createAdminCookieValue,
  getAdminPassword,
  isPlaceholderAdminPassword,
  isValidAdminCookie,
  verifyAdminPassword,
} from "../src/lib/admin-session.ts";

describe("admin password contract", () => {
  const prevPassword = process.env.ADMIN_PASSWORD;
  const prevVercel = process.env.VERCEL;

  afterEach(() => {
    if (prevPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = prevPassword;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
  });

  it("defaults to a known placeholder when unset", () => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.VERCEL;
    assert.equal(getAdminPassword(), PLACEHOLDER_ADMIN_PASSWORD);
    assert.equal(isPlaceholderAdminPassword(), true);
    assert.equal(verifyAdminPassword(PLACEHOLDER_ADMIN_PASSWORD), true);
    assert.equal(verifyAdminPassword("wrong"), false);
  });

  it("uses ADMIN_PASSWORD from the environment", () => {
    process.env.ADMIN_PASSWORD = "student-project-pass";
    delete process.env.VERCEL;
    assert.equal(verifyAdminPassword("student-project-pass"), true);
    assert.equal(verifyAdminPassword(PLACEHOLDER_ADMIN_PASSWORD), false);
  });

  it("rejects the placeholder password on Vercel", () => {
    delete process.env.ADMIN_PASSWORD;
    process.env.VERCEL = "1";
    assert.equal(verifyAdminPassword(PLACEHOLDER_ADMIN_PASSWORD), false);
  });
});

describe("signed admin cookie", () => {
  const prevPassword = process.env.ADMIN_PASSWORD;

  afterEach(() => {
    if (prevPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = prevPassword;
  });

  it("accepts a cookie minted for the current password", () => {
    process.env.ADMIN_PASSWORD = "editor-secret";
    const cookie = createAdminCookieValue();
    assert.equal(isValidAdminCookie(cookie), true);
  });

  it("rejects the old hardcoded authenticated string", () => {
    process.env.ADMIN_PASSWORD = "editor-secret";
    assert.equal(isValidAdminCookie("authenticated"), false);
  });

  it("rejects a cookie after the password changes", () => {
    process.env.ADMIN_PASSWORD = "first";
    const cookie = createAdminCookieValue();
    process.env.ADMIN_PASSWORD = "second";
    assert.equal(isValidAdminCookie(cookie), false);
  });
});
