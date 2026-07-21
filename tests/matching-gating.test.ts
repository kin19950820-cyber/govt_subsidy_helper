import { describe, it, expect } from "vitest";
import { matchSchemes } from "../src/lib/matching";
import { DEFAULT_ANSWERS } from "../src/lib/finder-storage";
import type { FinderAnswers, SubsidyScheme } from "../src/lib/types";

const today = new Date().toISOString().slice(0, 10);

// 一條會令分數 >= 6（very_likely）嘅規則 + 對應答案。
const strongRule = {
  maxIncomeBand: "above_40k" as const,
  travelRelated: true,
  boostSingleParent: true,
  boostNewArrival: true,
};

function scheme(slug: string, status: SubsidyScheme["status"]): SubsidyScheme {
  return {
    id: slug,
    slug,
    nameZh: slug,
    nameEn: slug,
    category: "測試",
    audience: ["low_income"],
    summary: "",
    suitableFor: "",
    notSuitableFor: "",
    eligibility: [],
    documents: [],
    steps: [],
    officialUrl: "https://www.gov.hk/",
    formUrl: "https://www.gov.hk/",
    department: "測試",
    phone: "",
    lastVerified: today,
    disclaimer: "",
    rule: strongRule,
    active: true,
    status,
  };
}

const answers: FinderAnswers = {
  ...DEFAULT_ANSWERS,
  group: "low_income",
  incomeBand: "below_10k",
  needTravelSupport: true,
  singleParent: true,
  newArrival: true,
};

describe("verification gating in matching", () => {
  it("verified benefit can reach very_likely; needs_review is capped to likely", () => {
    const results = matchSchemes(answers, [
      scheme("verified-one", "verified"),
      scheme("review-one", "needs_review"),
    ]);
    const v = results.find((r) => r.scheme.slug === "verified-one")!;
    const n = results.find((r) => r.scheme.slug === "review-one")!;
    expect(v.level).toBe("very_likely");
    expect(n.level).toBe("likely");
    expect(n.reasons.some((r) => r.includes("待核實"))).toBe(true);
  });
});
