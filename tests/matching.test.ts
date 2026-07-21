import { describe, it, expect } from "vitest";
import { matchSchemes } from "../src/lib/matching";
import { DEFAULT_ANSWERS } from "../src/lib/finder-storage";
import { getActiveBenefits } from "../src/lib/benefits/registry";
import { benefitToScheme } from "../src/lib/benefits/adapter";
import type { FinderAnswers, MatchLevel } from "../src/lib/types";

// 回歸基線：鎖定現有 matchSchemes 行為，之後遷移去規則引擎時可對照。
const schemes = getActiveBenefits().map(benefitToScheme);
const LEVELS: MatchLevel[] = ["very_likely", "likely", "unlikely", "consult"];

describe("matchSchemes (regression baseline)", () => {
  it("only returns benefits in the selected beneficiary group", () => {
    const answers: FinderAnswers = { ...DEFAULT_ANSWERS, group: "elderly", ageBand: "70_plus" };
    const results = matchSchemes(answers, schemes);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.scheme.audience).toContain("elderly");
  });

  it("returns a valid match level and reasons for every result", () => {
    const answers: FinderAnswers = { ...DEFAULT_ANSWERS, group: "student" };
    const results = matchSchemes(answers, schemes);
    for (const r of results) {
      expect(LEVELS).toContain(r.level);
      expect(Array.isArray(r.reasons)).toBe(true);
    }
  });

  it("is sorted by descending confidence weight", () => {
    const answers: FinderAnswers = { ...DEFAULT_ANSWERS, group: "low_income" };
    const results = matchSchemes(answers, schemes);
    const weight: Record<MatchLevel, number> = {
      very_likely: 3,
      likely: 2,
      consult: 1,
      unlikely: 0,
    };
    for (let i = 1; i < results.length; i++) {
      expect(weight[results[i - 1].level]).toBeGreaterThanOrEqual(weight[results[i].level]);
    }
  });

  it("a 70+ elderly applicant matches Old Age Allowance as very likely", () => {
    const answers: FinderAnswers = {
      ...DEFAULT_ANSWERS,
      group: "elderly",
      ageBand: "70_plus",
      onCssa: false,
    };
    const results = matchSchemes(answers, schemes);
    const oaa = results.find((r) => r.scheme.slug === "old-age-allowance");
    expect(oaa).toBeDefined();
    expect(["very_likely", "likely"]).toContain(oaa!.level);
  });
});
