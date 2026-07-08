import {
  AudienceGroup,
  DocumentKey,
  EligibilityRule,
  SubsidyScheme,
} from "../types";
import { getCategory } from "./registry";
import { Benefit } from "./types";

// 將通用 Benefit 轉成現有 UI 使用嘅 SubsidyScheme 形狀（無損遷移）。
export function benefitToScheme(b: Benefit): SubsidyScheme {
  return {
    id: b.id,
    slug: b.slug,
    nameZh: b.nameZh,
    nameEn: b.nameEn,
    category: getCategory(b.categoryCode)?.name_zh ?? b.categoryCode,
    audience: (b.audience ?? []) as AudienceGroup[],
    summary: b.summary,
    suitableFor: b.suitableFor ?? b.targetBeneficiaries ?? "",
    notSuitableFor: b.notSuitableFor ?? "",
    eligibility: b.eligibility ?? [],
    documents: (b.documents ?? [])
      .map((d) => d.key)
      .filter((k): k is DocumentKey => Boolean(k)),
    steps: b.steps ?? [],
    officialUrl: b.officialUrl,
    formUrl: b.formUrl ?? b.officialUrl,
    department: b.department,
    phone: b.contactPhone ?? "",
    lastVerified: b.lastUpdated ?? "",
    disclaimer: b.disclaimer,
    rule: (b.matchRule ?? {}) as EligibilityRule,
    active: b.active,
  };
}
