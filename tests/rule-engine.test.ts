import { describe, it, expect } from "vitest";
import { evaluate } from "../src/lib/eligibility/engine";
import type { RuleGroup } from "../src/lib/eligibility/rules";
import type { ApplicantFacts } from "../src/lib/eligibility/facts";

const ev = (
  facts: ApplicantFacts,
  ruleSet: RuleGroup | null,
  verification: "verified" | "needs_review" | "stale" | "inactive" = "verified"
) => evaluate(facts, { ruleSet, verification });

describe("rule engine — logic", () => {
  it("all: every condition must pass", () => {
    const rs: RuleGroup = {
      all: [
        { fact: "hkResident", op: "eq", value: true },
        { fact: "age", op: "gte", value: 65 },
      ],
    };
    expect(ev({ hkResident: true, age: 70 }, rs).outcome).toBe("likely_eligible");
    expect(ev({ hkResident: true, age: 60 }, rs).outcome).toBe("likely_not_eligible");
  });

  it("any: at least one passes", () => {
    const rs: RuleGroup = {
      any: [
        { fact: "onCssa", op: "eq", value: true },
        { fact: "onWfa", op: "eq", value: true },
      ],
    };
    expect(ev({ onCssa: false, onWfa: true }, rs).outcome).toBe("likely_eligible");
    expect(ev({ onCssa: false, onWfa: false }, rs).outcome).toBe("likely_not_eligible");
  });

  it("none: no condition may pass", () => {
    const rs: RuleGroup = { none: [{ fact: "onCssa", op: "eq", value: true }] };
    expect(ev({ onCssa: false }, rs).outcome).toBe("likely_eligible");
    expect(ev({ onCssa: true }, rs).outcome).toBe("likely_not_eligible");
  });

  it("nested groups (all + any)", () => {
    const rs: RuleGroup = {
      all: [
        { fact: "hkResident", op: "eq", value: true },
        { any: [{ fact: "age", op: "gte", value: 65 }, { fact: "hasDisability", op: "eq", value: true }] },
      ],
    };
    expect(ev({ hkResident: true, age: 40, hasDisability: true }, rs).outcome).toBe("likely_eligible");
    expect(ev({ hkResident: true, age: 40, hasDisability: false }, rs).outcome).toBe("likely_not_eligible");
  });

  it("unknown facts → insufficient / manual review", () => {
    const rs: RuleGroup = {
      all: [
        { fact: "hkResident", op: "eq", value: true },
        { fact: "age", op: "gte", value: 65 },
      ],
    };
    // nothing known
    expect(ev({}, rs).outcome).toBe("insufficient_information");
    // one known-pass, one unknown → partial positive
    const r = ev({ hkResident: true }, rs);
    expect(r.outcome).toBe("manual_review_required");
    expect(r.missingFacts).toContain("age");
  });

  it("numeric between + gte/lte", () => {
    const rs: RuleGroup = { all: [{ fact: "age", op: "between", value: [65, 120] }] };
    expect(ev({ age: 70 }, rs).outcome).toBe("likely_eligible");
    expect(ev({ age: 60 }, rs).outcome).toBe("likely_not_eligible");
  });

  it("date before/after", () => {
    const rs: RuleGroup = { all: [{ fact: "dateOfBirth", op: "before", value: "2000-01-01" }] };
    expect(ev({ dateOfBirth: "1990-05-05" }, rs).outcome).toBe("likely_eligible");
    expect(ev({ dateOfBirth: "2010-05-05" }, rs).outcome).toBe("likely_not_eligible");
  });

  it("income band inclusion", () => {
    const rs: RuleGroup = { all: [{ fact: "incomeBand", op: "in", value: ["below_10k", "10k_20k"] }] };
    expect(ev({ incomeBand: "below_10k" }, rs).outcome).toBe("likely_eligible");
    expect(ev({ incomeBand: "30k_40k" }, rs).outcome).toBe("likely_not_eligible");
  });

  it("asset limit + conflicting conditions", () => {
    const rs: RuleGroup = {
      all: [{ fact: "assetBand", op: "in", value: ["low", "medium"] }],
      none: [{ fact: "onCssa", op: "eq", value: true }],
    };
    expect(ev({ assetBand: "low", onCssa: false }, rs).outcome).toBe("likely_eligible");
    expect(ev({ assetBand: "low", onCssa: true }, rs).outcome).toBe("likely_not_eligible");
  });

  it("no ruleSet → not_assessed", () => {
    expect(ev({ age: 70 }, null).outcome).toBe("not_assessed");
  });
});

describe("rule engine — verification gating", () => {
  const rs: RuleGroup = { all: [{ fact: "age", op: "gte", value: 65 }] };
  const facts = { age: 70 };

  it("verified can be likely_eligible", () => {
    expect(ev(facts, rs, "verified").outcome).toBe("likely_eligible");
  });
  it("needs_review never high-confidence → possibly_eligible + warning", () => {
    const r = ev(facts, rs, "needs_review");
    expect(r.outcome).toBe("possibly_eligible");
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  it("stale never high-confidence → possibly_eligible + warning", () => {
    const r = ev(facts, rs, "stale");
    expect(r.outcome).toBe("possibly_eligible");
    expect(r.warnings.some((w) => w.includes("最新"))).toBe(true);
  });
  it("result always carries verificationStatus + explanations", () => {
    const r = ev(facts, rs, "verified");
    expect(r.verificationStatus).toBe("verified");
    expect(r.reasonsZh.length).toBeGreaterThan(0);
    expect(r.reasonsEn.length).toBeGreaterThan(0);
    expect(r.confidence).toBeGreaterThan(0);
  });
});
