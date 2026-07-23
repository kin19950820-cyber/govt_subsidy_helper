import { Benefit } from "../benefits/types";
import { EligibilityRule } from "../types";
import { ApplicantFacts, ApplicantFactKey, SENSITIVE_FACTS } from "../eligibility/facts";
import { Condition, isCondition, RuleGroup, RuleNode } from "../eligibility/rules";
import { matchRuleToRuleSet } from "../eligibility/compat";
import { Question, QUESTION_BY_FACT } from "./questions";

// 由規則集收集所有被引用嘅事實鍵。
export function collectRequiredFacts(node: RuleNode | null): Set<ApplicantFactKey> {
  const out = new Set<ApplicantFactKey>();
  const walk = (n: RuleNode) => {
    if (isCondition(n)) {
      out.add(n.fact);
      return;
    }
    for (const c of [...(n.all ?? []), ...(n.any ?? []), ...(n.none ?? [])]) walk(c);
  };
  if (node) walk(node);
  return out;
}

function benefitRuleSet(b: Benefit): RuleGroup | null {
  return b.ruleSet ?? matchRuleToRuleSet((b.matchRule ?? null) as EligibilityRule | null);
}

// showIf：只有當所有條件（用已知事實）成立時先顯示（progressive disclosure）。
function showIfSatisfied(facts: ApplicantFacts, conds?: Condition[]): boolean {
  if (!conds || conds.length === 0) return true;
  const rec = facts as Record<string, unknown>;
  return conds.every((c) => {
    const v = rec[c.fact];
    if (v === undefined || v === null) return false; // 未知 → 暫不顯示
    if (c.op === "in") return Array.isArray(c.value) && c.value.includes(v);
    if (c.op === "eq") return v === c.value;
    return true;
  });
}

export interface RankedQuestion {
  question: Question;
  benefitCount: number;
}

// 選題：根據候選福利所需、但未知嘅事實揀問題。
//  1) 影響福利數目（越多越前）
//  2) 重要性
//  3) 敏感度（越低越前）—— 若同樣可解決，先問非敏感問題
// 已答（answeredKeys）或已有值嘅事實不會重複再問。
export function selectQuestions(
  facts: ApplicantFacts,
  benefits: Benefit[],
  answeredKeys: Set<string> = new Set()
): Question[] {
  const rec = facts as Record<string, unknown>;
  const known = (f: string) => rec[f] !== undefined && rec[f] !== null;

  const count = new Map<ApplicantFactKey, number>();
  for (const b of benefits) {
    for (const f of collectRequiredFacts(benefitRuleSet(b))) {
      if (known(f) || answeredKeys.has(f)) continue;
      count.set(f, (count.get(f) ?? 0) + 1);
    }
  }

  const ranked: RankedQuestion[] = [];
  for (const [fact, benefitCount] of count) {
    const q = QUESTION_BY_FACT[fact];
    if (!q) continue; // 無對應題目 → 暫不問
    if (!showIfSatisfied(facts, q.showIf)) continue;
    ranked.push({ question: q, benefitCount });
  }

  ranked.sort((a, b) => {
    if (b.benefitCount !== a.benefitCount) return b.benefitCount - a.benefitCount;
    const imp = (b.question.importance ?? 0) - (a.question.importance ?? 0);
    if (imp !== 0) return imp;
    const sa = SENSITIVE_FACTS.has(a.question.fact) || a.question.sensitive ? 1 : 0;
    const sb = SENSITIVE_FACTS.has(b.question.fact) || b.question.sensitive ? 1 : 0;
    return sa - sb; // 非敏感優先
  });

  return ranked.map((r) => r.question);
}

export function nextQuestion(
  facts: ApplicantFacts,
  benefits: Benefit[],
  answeredKeys: Set<string> = new Set()
): Question | null {
  return selectQuestions(facts, benefits, answeredKeys)[0] ?? null;
}
