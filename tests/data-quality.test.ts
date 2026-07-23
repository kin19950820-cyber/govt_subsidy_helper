import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { scoreBenefit } from "../scripts/completeness-core.mjs";
import { getActiveBenefits, getAllBenefits } from "../src/lib/benefits/registry";

const ROOT = process.cwd();
const files = fs
  .readdirSync(path.join(ROOT, "content", "benefits"))
  .filter((f) => f.endsWith(".json"));
const benefits = files.map((f) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, "content", "benefits", f), "utf8"))
);

describe("completeness scorer", () => {
  it("flags a missing critical field", () => {
    const bad = { ...benefits[0], department: "" };
    expect(scoreBenefit(bad).criticalMissing).toContain("department");
  });
  it("every verified record passes all critical fields (build gate)", () => {
    for (const b of benefits) {
      if (b.status === "verified" && b.archived !== true) {
        expect(scoreBenefit(b).criticalMissing).toEqual([]);
      }
    }
  });
});

describe("data-quality rules", () => {
  it("no duplicate ids / slugs / aliases", () => {
    const ids = new Set<string>();
    const slugs = new Set<string>();
    const aliases = new Set<string>();
    for (const b of benefits) {
      expect(ids.has(b.id)).toBe(false);
      expect(slugs.has(b.slug)).toBe(false);
      ids.add(b.id);
      slugs.add(b.slug);
      for (const a of [...(b.aliases ?? []), ...(b.cantoneseNames ?? [])]) {
        expect(aliases.has(a)).toBe(false); // aliases must not collide across benefits
        aliases.add(a);
      }
    }
  });

  it("every benefit has zh + en display names", () => {
    for (const b of benefits) {
      expect(b.nameZh?.length).toBeGreaterThan(0);
      expect(b.nameEn?.length).toBeGreaterThan(0);
    }
  });

  it("no last-verified date in the future", () => {
    const now = Date.now();
    for (const b of benefits) {
      if (b.lastUpdated) expect(Date.parse(b.lastUpdated)).toBeLessThanOrEqual(now);
    }
  });

  it("every amount carries an effective date and source", () => {
    for (const b of benefits) {
      for (const a of b.amounts ?? []) {
        expect(a.effectiveFrom, `${b.slug} amount missing effectiveFrom`).toBeTruthy();
        expect(a.source, `${b.slug} amount missing source`).toBeTruthy();
      }
    }
  });

  it("archived benefits never appear in active discovery/matching", () => {
    const active = getActiveBenefits();
    expect(active.every((b) => b.archived !== true)).toBe(true);
    const archived = getAllBenefits().filter((b) => b.archived);
    for (const a of archived) expect(active.find((b) => b.slug === a.slug)).toBeUndefined();
  });
});
