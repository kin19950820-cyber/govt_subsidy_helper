import { VerificationState } from "../benefits/status";
import { ApplicantFactKey } from "./facts";
import { Operator } from "./rules";

// 引擎唔會做最終政府決定 —— 只提供指示性結果。
export type EligibilityOutcome =
  | "likely_eligible"
  | "possibly_eligible"
  | "insufficient_information"
  | "likely_not_eligible"
  | "manual_review_required"
  | "not_assessed";

export type BenefitVerificationStatus = VerificationState;

export type ConditionOutcome = "pass" | "fail" | "unknown";

export interface ConditionResult {
  fact: ApplicantFactKey;
  op: Operator;
  value?: unknown;
  result: ConditionOutcome;
  labelZh?: string;
  labelEn?: string;
  sourceRef?: string;
}

export interface EligibilityResult {
  outcome: EligibilityOutcome;
  confidence: number; // 0..1（指示性，非官方機率）
  matchedConditions: ConditionResult[];
  failedConditions: ConditionResult[];
  unknownConditions: ConditionResult[];
  reasonsZh: string[];
  reasonsEn: string[];
  missingFacts: ApplicantFactKey[];
  warnings: string[];
  verificationStatus: BenefitVerificationStatus;
}

export const OUTCOME_LABELS_ZH: Record<EligibilityOutcome, string> = {
  likely_eligible: "很可能符合",
  possibly_eligible: "可能符合",
  insufficient_information: "資料不足",
  likely_not_eligible: "未必符合",
  manual_review_required: "建議向官方確認",
  not_assessed: "未評估",
};
