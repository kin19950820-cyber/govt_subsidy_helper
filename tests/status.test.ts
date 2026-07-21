import { describe, it, expect } from "vitest";
import {
  isStale,
  verificationState,
  canBeHighConfidence,
} from "../src/lib/benefits/status";

const NOW = new Date("2026-07-21T00:00:00Z");

describe("status / staleness helpers", () => {
  it("isStale: > 12 months old is stale", () => {
    expect(isStale("2020-01-01", NOW)).toBe(true);
    expect(isStale("2026-06-01", NOW)).toBe(false);
    expect(isStale(undefined, NOW)).toBe(false);
    expect(isStale(null, NOW)).toBe(false);
  });

  it("verificationState covers verified / needs_review / stale / inactive", () => {
    expect(verificationState({ status: "verified", lastVerified: "2026-06-01", active: true }, NOW)).toBe("verified");
    expect(verificationState({ status: "verified", lastVerified: "2020-01-01", active: true }, NOW)).toBe("stale");
    expect(verificationState({ status: "needs_review", lastVerified: "2026-06-01", active: true }, NOW)).toBe("needs_review");
    expect(verificationState({ status: "draft", active: true }, NOW)).toBe("needs_review");
    expect(verificationState({ status: "verified", active: false }, NOW)).toBe("inactive");
  });

  it("canBeHighConfidence only for verified & not stale", () => {
    expect(canBeHighConfidence({ status: "verified", lastVerified: "2026-06-01", active: true }, NOW)).toBe(true);
    expect(canBeHighConfidence({ status: "verified", lastVerified: "2020-01-01", active: true }, NOW)).toBe(false);
    expect(canBeHighConfidence({ status: "needs_review", lastVerified: "2026-06-01", active: true }, NOW)).toBe(false);
  });
});
