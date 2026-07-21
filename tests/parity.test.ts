import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const ROOT = process.cwd();

describe("content ↔ benefits_seed.sql parity", () => {
  const benefitFiles = fs
    .readdirSync(path.join(ROOT, "content", "benefits"))
    .filter((f) => f.endsWith(".json"));
  const contentSlugs = benefitFiles.map((f) => f.replace(/\.json$/, "")).sort();

  const seedPath = path.join(ROOT, "supabase", "benefits_seed.sql");
  const seed = fs.readFileSync(seedPath, "utf8");
  const insertCount = (seed.match(/insert into public\.benefits \(/g) ?? []).length;

  it("seed has one benefits INSERT per content file", () => {
    expect(insertCount).toBe(benefitFiles.length);
  });

  it("every content slug appears in the seed", () => {
    for (const slug of contentSlugs) {
      expect(seed.includes(`'${slug}'`)).toBe(true);
    }
  });
});
