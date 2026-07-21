import { BenefitStatus } from "../types";

// 核實狀態 / 過時 判斷（Batch B）。
// 規則：
//  - 只有 verified 且未過時嘅福利，先可以出現喺高信心（very_likely）配對結果。
//  - needs_review / draft / 過時 都會顯示狀態標籤，並喺配對被降級。

export const STALE_AFTER_MONTHS = 12;

export type VerificationState =
  | "verified"
  | "needs_review"
  | "stale"
  | "inactive";

export interface StatusLike {
  status?: BenefitStatus;
  lastVerified?: string | null;
  active?: boolean;
}

function parseDate(d?: string | null): Date | null {
  if (!d) return null;
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : new Date(t);
}

// 最後核實日期距今超過 STALE_AFTER_MONTHS 個月 → 過時。
export function isStale(lastVerified?: string | null, now: Date = new Date()): boolean {
  const dt = parseDate(lastVerified);
  if (!dt) return false; // 無日期唔當過時（改由 needs_review 處理）
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - STALE_AFTER_MONTHS);
  return dt.getTime() < cutoff.getTime();
}

export function verificationState(
  b: StatusLike,
  now: Date = new Date()
): VerificationState {
  if (b.active === false) return "inactive";
  const verified = b.status === "verified";
  if (!verified) return "needs_review";
  return isStale(b.lastVerified, now) ? "stale" : "verified";
}

// 是否可獲高信心（very_likely）結果。
export function canBeHighConfidence(b: StatusLike, now: Date = new Date()): boolean {
  return verificationState(b, now) === "verified";
}

export const VERIFICATION_LABELS: Record<VerificationState, string> = {
  verified: "已核實",
  needs_review: "待核實",
  stale: "資料可能過時",
  inactive: "已停用",
};
