import { Confidence, EligibilityRule, Field, RuleOperator } from "../types.js";

// 建立一個帶來源 / 信心標記嘅欄位值。
// 預設：low / medium 信心自動標記 needs_review = true。
export function f<T>(
  value: T,
  confidence: Confidence,
  source_url: string,
  needs_review?: boolean
): Field<T> {
  return {
    value,
    confidence,
    needs_review: needs_review ?? confidence !== "high",
    source_url,
  };
}

export function rule(
  field: string,
  operator: RuleOperator,
  value: unknown,
  source_url: string,
  confidence: Confidence = "high",
  needs_review?: boolean
): EligibilityRule {
  return {
    field,
    operator,
    value,
    source_url,
    confidence,
    needs_review: needs_review ?? confidence !== "high",
  };
}
