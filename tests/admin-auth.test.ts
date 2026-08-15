import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

/**
 * Admin password helpers live next to next/headers, so we re-check the
 * same contract here without importing Next.js.
 */
function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "change-me-before-deploy";
}

function verifyAdminPassword(password: string): boolean {
  return password === getAdminPassword();
}

describe("admin password contract", () => {
  const prev = process.env.ADMIN_PASSWORD;

  afterEach(() => {
    if (prev === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = prev;
  });

  it("defaults to a known placeholder when unset", () => {
    delete process.env.ADMIN_PASSWORD;
    assert.equal(getAdminPassword(), "change-me-before-deploy");
    assert.equal(verifyAdminPassword("change-me-before-deploy"), true);
    assert.equal(verifyAdminPassword("wrong"), false);
  });

  it("uses ADMIN_PASSWORD from the environment", () => {
    process.env.ADMIN_PASSWORD = "student-project-pass";
    assert.equal(verifyAdminPassword("student-project-pass"), true);
    assert.equal(verifyAdminPassword("change-me-before-deploy"), false);
  });
});
