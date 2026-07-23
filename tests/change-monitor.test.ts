import { describe, it, expect } from "vitest";
import { diffSnapshots, snapshotFromBenefits, sha256 } from "../scripts/change-monitor-core.mjs";

describe("change monitor core", () => {
  it("builds a snapshot keyed by source url", () => {
    const snap = snapshotFromBenefits([
      { slug: "a", sources: [{ url: "https://x.gov.hk/", contentHash: "h1", status: "active" }] },
      { slug: "b", sources: [{ url: "https://y.gov.hk/" }] },
    ]);
    expect(snap["https://x.gov.hk/"]).toEqual({ contentHash: "h1", slug: "a", status: "active" });
    expect(snap["https://y.gov.hk/"]).toEqual({ contentHash: "", slug: "b", status: "" });
  });

  it("diffs added / removed / hash-changed sources", () => {
    const baseline = {
      "https://keep.gov.hk/": { contentHash: "same" },
      "https://gone.gov.hk/": { contentHash: "old" },
      "https://moved.gov.hk/": { contentHash: "v1" },
    };
    const current = {
      "https://keep.gov.hk/": { contentHash: "same", slug: "k" },
      "https://moved.gov.hk/": { contentHash: "v2", slug: "m" },
      "https://new.gov.hk/": { contentHash: "n", slug: "n" },
    };
    const { added, removed, changed } = diffSnapshots(baseline, current);
    expect(added.map((a) => a.url)).toEqual(["https://new.gov.hk/"]);
    expect(removed.map((r) => r.url)).toEqual(["https://gone.gov.hk/"]);
    expect(changed).toEqual([{ url: "https://moved.gov.hk/", from: "v1", to: "v2", slug: "m" }]);
  });

  it("empty baseline treats everything as added, nothing removed", () => {
    const current = { "https://a.gov.hk/": { contentHash: "x" } };
    const { added, removed, changed } = diffSnapshots({}, current);
    expect(added).toHaveLength(1);
    expect(removed).toHaveLength(0);
    expect(changed).toHaveLength(0);
  });

  it("sha256 is stable and content-sensitive", () => {
    expect(sha256("hello")).toBe(sha256("hello"));
    expect(sha256("hello")).not.toBe(sha256("world"));
  });
});
