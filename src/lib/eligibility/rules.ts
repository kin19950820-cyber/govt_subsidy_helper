import { ApplicantFactKey } from "./facts";

// 可組合、可驗證嘅資格規則模型。
// 三值邏輯：pass / fail / unknown（欠缺事實）。

export type Operator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "not_in"
  | "contains"
  | "between"
  | "exists"
  | "not_exists"
  | "before"
  | "after";

export interface Condition {
  fact: ApplicantFactKey;
  op: Operator;
  // scalar（比較）；array（in/not_in/contains）；[min,max]（between）；ISO 日期（before/after）
  value?: unknown;
  // 顯示 / 官方要求說明
  labelZh?: string;
  labelEn?: string;
  sourceRef?: string; // 指向官方要求（source url / 條款）
}

export interface RuleGroup {
  all?: RuleNode[]; // 全部須成立（AND）
  any?: RuleNode[]; // 至少一項成立（OR）
  none?: RuleNode[]; // 全部不可成立（NOT）
}

export type RuleNode = Condition | RuleGroup;

export function isCondition(n: RuleNode): n is Condition {
  return (n as Condition).fact !== undefined;
}

export function isRuleGroup(n: RuleNode): n is RuleGroup {
  return (
    (n as RuleGroup).all !== undefined ||
    (n as RuleGroup).any !== undefined ||
    (n as RuleGroup).none !== undefined
  );
}
