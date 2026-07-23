import { Benefit } from "../benefits/types";
import { EligibilityRule } from "../types";
import { verificationState, VerificationState } from "../benefits/status";
import { ApplicantFacts, ApplicantFactKey } from "./facts";
import { Condition, isCondition, RuleGroup, RuleNode } from "./rules";
import { matchRuleToRuleSet } from "./compat";
import {
  ConditionOutcome,
  ConditionResult,
  EligibilityOutcome,
  EligibilityResult,
} from "./outcome";

// ---- 單一條件三值評估 ----
function evalCondition(facts: ApplicantFacts, c: Condition): ConditionOutcome {
  const v = (facts as Record<string, unknown>)[c.fact];

  if (c.op === "exists") return v !== undefined && v !== null ? "pass" : "fail";
  if (c.op === "not_exists") return v === undefined || v === null ? "pass" : "fail";

  if (v === undefined || v === null) return "unknown";

  const val = c.value;
  switch (c.op) {
    case "eq":
      return v === val ? "pass" : "fail";
    case "neq":
      return v !== val ? "pass" : "fail";
    case "gt":
      return Number(v) > Number(val) ? "pass" : "fail";
    case "gte":
      return Number(v) >= Number(val) ? "pass" : "fail";
    case "lt":
      return Number(v) < Number(val) ? "pass" : "fail";
    case "lte":
      return Number(v) <= Number(val) ? "pass" : "fail";
    case "in":
      return Array.isArray(val) && val.includes(v) ? "pass" : "fail";
    case "not_in":
      return Array.isArray(val) && !val.includes(v) ? "pass" : "fail";
    case "contains":
      if (Array.isArray(v)) return v.includes(val) ? "pass" : "fail";
      return String(v).includes(String(val)) ? "pass" : "fail";
    case "between": {
      if (!Array.isArray(val) || val.length !== 2) return "unknown";
      const n = Number(v);
      return n >= Number(val[0]) && n <= Number(val[1]) ? "pass" : "fail";
    }
    case "before":
      return Date.parse(String(v)) < Date.parse(String(val)) ? "pass" : "fail";
    case "after":
      return Date.parse(String(v)) > Date.parse(String(val)) ? "pass" : "fail";
    default:
      return "unknown";
  }
}

// ---- 收集所有條件結果（供解釋） ----
function walk(
  facts: ApplicantFacts,
  node: RuleNode,
  out: ConditionResult[]
): ConditionOutcome {
  if (isCondition(node)) {
    const result = evalCondition(facts, node);
    out.push({
      fact: node.fact,
      op: node.op,
      value: node.value,
      result,
      labelZh: node.labelZh,
      labelEn: node.labelEn,
      sourceRef: node.sourceRef,
    });
    return result;
  }
  return evalGroup(facts, node, out);
}

function combineAll(results: ConditionOutcome[]): ConditionOutcome {
  if (results.some((r) => r === "fail")) return "fail";
  if (results.some((r) => r === "unknown")) return "unknown";
  return "pass";
}
function combineAny(results: ConditionOutcome[]): ConditionOutcome {
  if (results.some((r) => r === "pass")) return "pass";
  if (results.some((r) => r === "unknown")) return "unknown";
  return "fail";
}
function combineNone(results: ConditionOutcome[]): ConditionOutcome {
  if (results.some((r) => r === "pass")) return "fail";
  if (results.some((r) => r === "unknown")) return "unknown";
  return "pass";
}

function evalGroup(
  facts: ApplicantFacts,
  group: RuleGroup,
  out: ConditionResult[]
): ConditionOutcome {
  const parts: ConditionOutcome[] = [];
  if (group.all) parts.push(combineAll(group.all.map((n) => walk(facts, n, out))));
  if (group.any) parts.push(combineAny(group.any.map((n) => walk(facts, n, out))));
  if (group.none) parts.push(combineNone(group.none.map((n) => walk(facts, n, out))));
  // 多個群組並存 → 當作 AND
  return combineAll(parts);
}

const clamp = (x: number) => Math.max(0, Math.min(1, Math.round(x * 100) / 100));

// ---- 主入口：對「規則集 + 核實狀態」評估 ----
export function evaluate(
  facts: ApplicantFacts,
  opts: { ruleSet: RuleGroup | null; verification: VerificationState }
): EligibilityResult {
  const { ruleSet, verification } = opts;
  const warnings: string[] = [];
  if (verification === "needs_review")
    warnings.push("部分資料仍待核實，請先查看官方網站。");
  if (verification === "stale")
    warnings.push("資料可能已更新，請以官方最新公布為準。");
  if (verification === "inactive")
    warnings.push("此計劃可能已完結或停止接受申請。");

  if (!ruleSet) {
    return {
      outcome: "not_assessed",
      confidence: 0,
      matchedConditions: [],
      failedConditions: [],
      unknownConditions: [],
      reasonsZh: [],
      reasonsEn: [],
      missingFacts: [],
      warnings,
      verificationStatus: verification,
    };
  }

  const results: ConditionResult[] = [];
  const rootTri = evalGroup(facts, ruleSet, results);

  const matched = results.filter((r) => r.result === "pass");
  const failed = results.filter((r) => r.result === "fail");
  const unknown = results.filter((r) => r.result === "unknown");
  const total = results.length || 1;
  const verified = verification === "verified";

  let outcome: EligibilityOutcome;
  let confidence: number;
  if (rootTri === "fail") {
    outcome = "likely_not_eligible";
    confidence = clamp(0.6 + 0.4 * (failed.length / total));
  } else if (rootTri === "pass") {
    outcome = verified ? "likely_eligible" : "possibly_eligible";
    confidence = clamp(
      (verified ? 0.85 : 0.6) + 0.1 * (matched.length / total)
    );
  } else {
    // unknown root
    if (matched.length > 0) {
      outcome = "manual_review_required";
      confidence = clamp(0.4 + 0.2 * (matched.length / total));
    } else {
      outcome = "insufficient_information";
      confidence = clamp(0.2 + 0.1 * (matched.length / total));
    }
  }

  const reasonsZh: string[] = [];
  const reasonsEn: string[] = [];
  for (const m of matched) {
    reasonsZh.push(`✓ ${m.labelZh ?? m.fact}`);
    reasonsEn.push(`✓ ${m.labelEn ?? m.fact}`);
  }
  for (const f of failed) {
    reasonsZh.push(`✗ ${f.labelZh ?? f.fact}（可能不符合）`);
    reasonsEn.push(`✗ ${f.labelEn ?? f.fact} (may not qualify)`);
  }
  for (const u of unknown) {
    reasonsZh.push(`? ${u.labelZh ?? u.fact}（需要更多資料）`);
    reasonsEn.push(`? ${u.labelEn ?? u.fact} (need more info)`);
  }

  const missingFacts = Array.from(
    new Set(unknown.map((u) => u.fact))
  ) as ApplicantFactKey[];

  return {
    outcome,
    confidence,
    matchedConditions: matched,
    failedConditions: failed,
    unknownConditions: unknown,
    reasonsZh,
    reasonsEn,
    missingFacts,
    warnings,
    verificationStatus: verification,
  };
}

// ---- 對 Benefit 評估（用 ruleSet，否則由 legacy matchRule 轉換） ----
export function evaluateBenefit(
  facts: ApplicantFacts,
  benefit: Benefit
): EligibilityResult {
  const ruleSet =
    benefit.ruleSet ??
    matchRuleToRuleSet((benefit.matchRule ?? null) as EligibilityRule | null);
  return evaluate(facts, {
    ruleSet,
    verification: verificationState({
      status: benefit.status,
      lastVerified: benefit.lastUpdated,
      active: benefit.active,
    }),
  });
}
