import { describe, it, expect } from "vitest";
import { selectQuestions, nextQuestion, collectRequiredFacts } from "../src/lib/questionnaire/select";
import type { RuleGroup } from "../src/lib/eligibility/rules";
import type { Benefit } from "../src/lib/benefits/types";
import type { ApplicantFacts } from "../src/lib/eligibility/facts";

// 最小合成 Benefit（只需 ruleSet + 少量欄位）
function mk(slug: string, ruleSet: RuleGroup): Benefit {
  return {
    id: slug,
    slug,
    nameZh: slug,
    nameEn: slug,
    department: "x",
    categoryCode: "social_security",
    lifeEvents: [],
    purpose: "",
    targetBeneficiaries: "",
    summary: "",
    eligibility: [],
    documents: [],
    steps: [],
    officialUrl: "https://www.gov.hk/",
    forms: [],
    sources: [],
    faq: [],
    rules: [],
    ruleSet,
    facets: {},
    relatedSlugs: [],
    disclaimer: "",
    status: "verified",
    active: true,
  } as Benefit;
}

describe("collectRequiredFacts", () => {
  it("gathers fact keys from nested rule groups", () => {
    const rs: RuleGroup = {
      all: [
        { fact: "hkResident", op: "eq", value: true },
        { any: [{ fact: "ageBand", op: "in", value: ["70_plus"] }, { fact: "onCssa", op: "eq", value: true }] },
      ],
    };
    const facts = collectRequiredFacts(rs);
    expect([...facts].sort()).toEqual(["ageBand", "hkResident", "onCssa"]);
  });
});

describe("question selection", () => {
  const bAge = mk("age-b", { all: [{ fact: "ageBand", op: "in", value: ["70_plus"] }] });
  const bIncome = mk("income-b", { all: [{ fact: "incomeBand", op: "in", value: ["below_10k"] }] });
  const bHk = mk("hk-b", { all: [{ fact: "hkResident", op: "eq", value: true }] });

  it("no duplicate questions (each fact once)", () => {
    const qs = selectQuestions({}, [bAge, bAge, mk("x", { all: [{ fact: "ageBand", op: "in", value: ["70_plus"] }] })]);
    const facts = qs.map((q) => q.fact);
    expect(new Set(facts).size).toBe(facts.length);
  });

  it("excludes already-answered facts (no re-asking)", () => {
    const facts: ApplicantFacts = { ageBand: "70_plus" };
    const qs = selectQuestions(facts, [bAge]);
    expect(qs.find((q) => q.fact === "ageBand")).toBeUndefined();
  });

  it("excludes facts in answeredKeys (skip / unknown / prefer-not)", () => {
    const qs = selectQuestions({}, [bAge], new Set(["ageBand"]));
    expect(qs.find((q) => q.fact === "ageBand")).toBeUndefined();
  });

  it("prioritises the fact affecting the most benefits", () => {
    // ageBand needed by 2 benefits, hkResident by 1 → ageBand first
    const qs = selectQuestions({}, [bAge, mk("age2", { all: [{ fact: "ageBand", op: "in", value: ["65_69"] }] }), bHk]);
    expect(qs[0].fact).toBe("ageBand");
  });

  it("progressive disclosure: assetBand hidden until age known, shown when elderly", () => {
    const bAsset = mk("asset-b", { all: [{ fact: "assetBand", op: "in", value: ["low"] }] });
    // age unknown → assetBand question suppressed by showIf
    expect(selectQuestions({}, [bAsset]).find((q) => q.fact === "assetBand")).toBeUndefined();
    // age known elderly → assetBand shown
    const qs = selectQuestions({ ageBand: "70_plus" }, [bAsset]);
    expect(qs.find((q) => q.fact === "assetBand")).toBeDefined();
  });

  it("recalculates: answering a fact removes its question", () => {
    const before = selectQuestions({}, [bIncome, bHk]).length;
    const after = selectQuestions({ hkResident: true }, [bIncome, bHk]).length;
    expect(after).toBe(before - 1);
  });

  it("nextQuestion returns the top-ranked question or null", () => {
    expect(nextQuestion({}, [bHk])?.fact).toBe("hkResident");
    expect(nextQuestion({ hkResident: true }, [bHk])).toBeNull();
  });
});
