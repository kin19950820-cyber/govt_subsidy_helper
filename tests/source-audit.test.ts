import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { auditSources, isAllowedDomain } from "../scripts/source-audit-core.mjs";

const ROOT = process.cwd();
const allow = JSON.parse(
  fs.readFileSync(path.join(ROOT, "content", "taxonomy", "official_domains.json"), "utf8")
).allow as string[];
const benefits = fs
  .readdirSync(path.join(ROOT, "content", "benefits"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", "benefits", f), "utf8")));

describe("source audit (offline)", () => {
  it("allowlist matches subdomains but not arbitrary domains", () => {
    expect(isAllowedDomain("www.swd.gov.hk", allow)).toBe(true);
    expect(isAllowedDomain("swd.gov.hk", allow)).toBe(true);
    expect(isAllowedDomain("evil.example.com", allow)).toBe(false);
    expect(isAllowedDomain("notgov.hk", allow)).toBe(false);
  });

  it("flags non-https, malformed and unexpected-domain URLs", () => {
    const b = {
      slug: "x",
      officialUrl: "http://insecure.gov.hk/",
      sources: [{ url: "https://evil.example.com/" }, { url: "not-a-url" }],
    };
    const types = auditSources(b, { allow }).map((i) => i.type);
    expect(types).toContain("non_https");
    expect(types).toContain("unexpected_domain");
    expect(types).toContain("malformed_url");
  });

  it("current content has zero error-level source issues", () => {
    for (const b of benefits) {
      const errors = auditSources(b, { allow }).filter((i) => i.severity === "error");
      expect(errors, `${b.slug}: ${JSON.stringify(errors)}`).toEqual([]);
    }
  });
});
