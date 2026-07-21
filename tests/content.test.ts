import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  BenefitSchema,
  CategorySchema,
  LifeEventSchema,
  BeneficiaryGroupSchema,
  DocumentTypeSchema,
  DepartmentSchema,
} from "../src/lib/benefits/schema";

const ROOT = process.cwd();
const readJson = (p: string) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

const categories = readJson("content/taxonomy/categories.json");
const lifeEvents = readJson("content/taxonomy/life_events.json");
const beneficiaryGroups = readJson("content/taxonomy/beneficiary_groups.json");
const documentTypes = readJson("content/taxonomy/document_types.json");
const departments = readJson("content/taxonomy/departments.json");

const catCodes = new Set(categories.map((c: any) => c.code));
const leCodes = new Set(lifeEvents.map((e: any) => e.code));
const bgCodes = new Set(beneficiaryGroups.map((g: any) => g.code));
const dtCodes = new Set(documentTypes.map((d: any) => d.code));

const benefitsDir = path.join(ROOT, "content", "benefits");
const benefitFiles = fs
  .readdirSync(benefitsDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

describe("taxonomy files are valid", () => {
  it("categories", () => {
    for (const c of categories) expect(CategorySchema.safeParse(c).success).toBe(true);
  });
  it("life_events", () => {
    for (const e of lifeEvents) expect(LifeEventSchema.safeParse(e).success).toBe(true);
  });
  it("beneficiary_groups", () => {
    for (const g of beneficiaryGroups)
      expect(BeneficiaryGroupSchema.safeParse(g).success).toBe(true);
  });
  it("document_types", () => {
    for (const d of documentTypes)
      expect(DocumentTypeSchema.safeParse(d).success).toBe(true);
  });
  it("departments", () => {
    for (const d of departments) expect(DepartmentSchema.safeParse(d).success).toBe(true);
  });
});

describe("every benefit file is valid and consistent", () => {
  it("has at least the migrated catalogue", () => {
    expect(benefitFiles.length).toBeGreaterThanOrEqual(21);
  });

  const slugs = new Set<string>();

  for (const file of benefitFiles) {
    const b = readJson(path.join("content", "benefits", file));

    it(`${file}: matches the Zod schema`, () => {
      const res = BenefitSchema.safeParse(b);
      if (!res.success) {
        throw new Error(
          `${file} failed schema:\n` + JSON.stringify(res.error.issues, null, 2)
        );
      }
    });

    it(`${file}: slug matches filename and is unique`, () => {
      expect(`${b.slug}.json`).toBe(file);
      expect(slugs.has(b.slug)).toBe(false);
      slugs.add(b.slug);
    });

    it(`${file}: references known taxonomy codes`, () => {
      expect(catCodes.has(b.categoryCode)).toBe(true);
      for (const le of b.lifeEvents) expect(leCodes.has(le)).toBe(true);
      for (const g of b.audience ?? []) expect(bgCodes.has(g)).toBe(true);
      for (const d of b.documents ?? []) {
        if (d.key) expect(dtCodes.has(d.key)).toBe(true);
      }
    });

    it(`${file}: has an official URL and a disclaimer`, () => {
      expect(b.officialUrl).toMatch(/^https?:\/\//);
      expect((b.disclaimer ?? "").length).toBeGreaterThan(0);
    });
  }
});
