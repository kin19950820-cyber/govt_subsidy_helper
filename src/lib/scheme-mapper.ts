import { DOCUMENT_LABELS, DocumentKey, SubsidyScheme } from "./types";
import { getCategories, getCategory } from "./benefits/registry";

// Admin CMS ⇄ public.benefits（去正規化列）之間嘅對映。
// Admin UI 仍以 SubsidyScheme 形狀運作（向後相容）；此處負責 benefits 列 ⇄ scheme。

function labelToCategoryCode(label: string): string {
  const hit = getCategories().find((c) => c.name_zh === label || c.code === label);
  return hit?.code ?? label;
}

export function rowToScheme(row: any): SubsidyScheme {
  return {
    id: row.id,
    slug: row.slug,
    nameZh: row.name_zh,
    nameEn: row.name_en ?? "",
    category: getCategory(row.category_code)?.name_zh ?? row.category_code ?? "",
    audience: row.audience ?? [],
    summary: row.summary ?? "",
    suitableFor: row.suitable_for ?? "",
    notSuitableFor: row.not_suitable_for ?? "",
    eligibility: row.eligibility ?? [],
    documents: (row.documents ?? [])
      .map((d: any) => d.key)
      .filter((k: any): k is DocumentKey => Boolean(k)),
    steps: row.steps ?? [],
    officialUrl: row.official_url ?? "",
    formUrl: row.form_url ?? row.official_url ?? "",
    department: row.department ?? "",
    phone: row.contact_phone ?? "",
    lastVerified: row.last_updated ?? "",
    disclaimer: row.disclaimer ?? "",
    rule: row.match_rule ?? {},
    active: row.active ?? true,
    status: row.status ?? "needs_review",
    sourceUrl: row.source_url ?? row.official_url ?? "",
  };
}

// SubsidyScheme → benefits 列（只設有提供嘅欄位，支援部分更新）。
export function schemeToRow(s: Partial<SubsidyScheme>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (s.id !== undefined) row.id = s.id;
  if (s.slug !== undefined) row.slug = s.slug;
  if (s.nameZh !== undefined) row.name_zh = s.nameZh;
  if (s.nameEn !== undefined) row.name_en = s.nameEn;
  if (s.category !== undefined) row.category_code = labelToCategoryCode(s.category);
  if (s.audience !== undefined) row.audience = s.audience;
  if (s.summary !== undefined) row.summary = s.summary;
  if (s.suitableFor !== undefined) {
    row.suitable_for = s.suitableFor;
    row.target_beneficiaries = s.suitableFor;
  }
  if (s.notSuitableFor !== undefined) row.not_suitable_for = s.notSuitableFor;
  if (s.eligibility !== undefined) row.eligibility = s.eligibility;
  if (s.documents !== undefined)
    row.documents = s.documents.map((k) => ({ key: k, label: DOCUMENT_LABELS[k], required: true }));
  if (s.steps !== undefined) row.steps = s.steps;
  if (s.officialUrl !== undefined) {
    row.official_url = s.officialUrl;
    row.source_url = s.sourceUrl ?? s.officialUrl;
  }
  if (s.formUrl !== undefined) row.form_url = s.formUrl;
  if (s.department !== undefined) row.department = s.department;
  if (s.phone !== undefined) row.contact_phone = s.phone;
  if (s.lastVerified !== undefined) row.last_updated = s.lastVerified || null;
  if (s.disclaimer !== undefined) row.disclaimer = s.disclaimer;
  if (s.rule !== undefined) row.match_rule = s.rule;
  if (s.summary !== undefined && row.purpose === undefined) row.purpose = s.summary;
  if (s.status !== undefined) row.status = s.status;
  if (s.active !== undefined) row.active = s.active;
  return row;
}
