import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { siteConfig, siteCopy } from "../src/lib/site.ts";

describe("site branding", () => {
  it("uses Project STEAM with STEAM in caps", () => {
    assert.equal(siteConfig.name, "Project STEAM");
    assert.match(siteCopy.askTitle, /Project STEAM/);
    assert.match(siteCopy.aboutTitle, /Project STEAM/);
  });

  it("points submissions at the collective Gmail", () => {
    assert.equal(
      siteConfig.submitEmail,
      "projectsteamcollective@gmail.com",
    );
  });

  it("has required hero and section copy", () => {
    for (const key of [
      "heroTitle",
      "heroLead",
      "subjectsTitle",
      "recentTitle",
      "submitTitle",
      "askTitle",
    ] as const) {
      assert.ok(siteCopy[key].trim().length > 0, `${key} should be set`);
    }
  });
});
