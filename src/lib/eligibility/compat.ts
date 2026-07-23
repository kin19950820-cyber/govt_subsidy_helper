import { AgeBand, AssetBand, EligibilityRule, IncomeBand } from "../types";
import { Condition, RuleGroup, RuleNode } from "./rules";

// 相容層：將舊 EligibilityRule（matchRule）轉成 RuleGroup，
// 令 21 個現有福利毋須改內容即可用新引擎（只映射「硬性」條件，
// 舊有加分/軟性訊號留返畀 legacy scorer / 之後人手補 ruleSet）。

const AGE_ORDER: AgeBand[] = ["below_60", "60_64", "65_69", "70_plus"];
const INCOME_ORDER: IncomeBand[] = [
  "below_10k",
  "10k_20k",
  "20k_30k",
  "30k_40k",
  "above_40k",
];
const ASSET_ORDER: AssetBand[] = ["low", "medium", "high"];

const gte = <T>(order: T[], min: T) => order.slice(order.indexOf(min));
const lte = <T>(order: T[], max: T) => order.slice(0, order.indexOf(max) + 1);

export function matchRuleToRuleSet(
  rule: EligibilityRule | undefined | null
): RuleGroup | null {
  if (!rule) return null;
  const all: RuleNode[] = [];
  const none: RuleNode[] = [];

  if (rule.gradeLevels && rule.gradeLevels.length > 0) {
    all.push(cond("educationLevel", "in", rule.gradeLevels, "須就讀適用教育階段"));
  }
  if (rule.minAgeBand) {
    all.push(cond("ageBand", "in", gte(AGE_ORDER, rule.minAgeBand), "須達最低年齡要求"));
  } else if (rule.requiresElderly) {
    all.push(cond("ageBand", "in", gte(AGE_ORDER, "65_69"), "須為長者"));
  }
  if (rule.maxIncomeBand && rule.meansTested !== false) {
    all.push(cond("incomeBand", "in", lte(INCOME_ORDER, rule.maxIncomeBand), "須通過入息審查"));
  }
  if (rule.maxAssetBand) {
    all.push(cond("assetBand", "in", lte(ASSET_ORDER, rule.maxAssetBand), "須通過資產審查"));
  }
  if (rule.requiresCssa) {
    all.push(cond("onCssa", "eq", true, "須正領取綜援"));
  }
  if (rule.excludeIfCssa) {
    none.push(cond("onCssa", "eq", true, "領取綜援者不適用"));
  }
  if (rule.requiresDisability) {
    all.push(cond("hasDisability", "eq", true, "須為殘疾人士"));
  }

  if (all.length === 0 && none.length === 0) return null;
  const group: RuleGroup = {};
  if (all.length) group.all = all;
  if (none.length) group.none = none;
  return group;
}

function cond(
  fact: Condition["fact"],
  op: Condition["op"],
  value: unknown,
  labelZh: string
): Condition {
  return { fact, op, value, labelZh };
}
