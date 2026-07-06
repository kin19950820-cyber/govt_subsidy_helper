import { SubsidyScheme } from "./types";

export function rowToScheme(row: any): SubsidyScheme {
  return {
    id: row.id,
    slug: row.slug,
    nameZh: row.name_zh,
    nameEn: row.name_en,
    category: row.category ?? "",
    audience: row.audience ?? [],
    summary: row.summary ?? "",
    suitableFor: row.suitable_for ?? "",
    notSuitableFor: row.not_suitable_for ?? "",
    eligibility: row.eligibility ?? [],
    documents: row.documents ?? [],
    steps: row.steps ?? [],
    officialUrl: row.official_url ?? "",
    formUrl: row.form_url ?? "",
    department: row.department ?? "",
    phone: row.phone ?? "",
    lastVerified: row.last_verified ?? "",
    disclaimer: row.disclaimer ?? "",
    rule: row.rule ?? {},
    active: row.active ?? true,
  };
}

export function schemeToRow(s: Partial<SubsidyScheme>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (s.id !== undefined) row.id = s.id;
  if (s.slug !== undefined) row.slug = s.slug;
  if (s.nameZh !== undefined) row.name_zh = s.nameZh;
  if (s.nameEn !== undefined) row.name_en = s.nameEn;
  if (s.category !== undefined) row.category = s.category;
  if (s.audience !== undefined) row.audience = s.audience;
  if (s.summary !== undefined) row.summary = s.summary;
  if (s.suitableFor !== undefined) row.suitable_for = s.suitableFor;
  if (s.notSuitableFor !== undefined) row.not_suitable_for = s.notSuitableFor;
  if (s.eligibility !== undefined) row.eligibility = s.eligibility;
  if (s.documents !== undefined) row.documents = s.documents;
  if (s.steps !== undefined) row.steps = s.steps;
  if (s.officialUrl !== undefined) row.official_url = s.officialUrl;
  if (s.formUrl !== undefined) row.form_url = s.formUrl;
  if (s.department !== undefined) row.department = s.department;
  if (s.phone !== undefined) row.phone = s.phone;
  if (s.lastVerified !== undefined) row.last_verified = s.lastVerified;
  if (s.disclaimer !== undefined) row.disclaimer = s.disclaimer;
  if (s.rule !== undefined) row.rule = s.rule;
  if (s.active !== undefined) row.active = s.active;
  return row;
}
