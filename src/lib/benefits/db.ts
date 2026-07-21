import { createClient } from "../supabase/server";
import { Benefit } from "./types";

// 由 public.benefits 讀取（去正規化列）。任何錯誤 / 空結果都回傳 null，
// 讓呼叫方 fallback 去 content registry（永不 fallback 去舊 subsidy_schemes）。

function rowToBenefit(row: any): Benefit {
  return {
    id: row.id,
    slug: row.slug,
    nameZh: row.name_zh,
    nameEn: row.name_en ?? "",
    department: row.department ?? "",
    categoryCode: row.category_code ?? "",
    lifeEvents: row.life_events ?? [],
    audience: row.audience ?? [],
    matchRule: row.match_rule ?? {},
    purpose: row.purpose ?? "",
    targetBeneficiaries: row.target_beneficiaries ?? "",
    summary: row.summary ?? "",
    suitableFor: row.suitable_for ?? "",
    notSuitableFor: row.not_suitable_for ?? "",
    eligibility: row.eligibility ?? [],
    meansTest: row.means_test ?? undefined,
    residencyRequirement: row.residency_requirement ?? undefined,
    incomeRequirement: row.income_requirement ?? undefined,
    assetRequirement: row.asset_requirement ?? undefined,
    ageRequirement: row.age_requirement ?? undefined,
    employmentRequirement: row.employment_requirement ?? undefined,
    studentRequirement: row.student_requirement ?? undefined,
    documents: row.documents ?? [],
    steps: row.steps ?? [],
    applicationMethod: row.application_method ?? undefined,
    onlineUrl: row.online_url ?? undefined,
    formUrl: row.form_url ?? undefined,
    guidanceUrl: row.guidance_url ?? undefined,
    faqUrl: row.faq_url ?? undefined,
    processingTime: row.processing_time ?? undefined,
    renewal: row.renewal ?? undefined,
    appeal: row.appeal ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    officialUrl: row.official_url ?? "",
    sourceUrl: row.source_url ?? undefined,
    lastUpdated: row.last_updated ?? undefined,
    forms: row.forms ?? [],
    sources: row.sources ?? [],
    faq: row.faq ?? [],
    rules: row.rules ?? [],
    facets: row.facets ?? {},
    relatedSlugs: row.related_slugs ?? [],
    disclaimer: row.disclaimer ?? "",
    status: row.status ?? "needs_review",
    active: row.active ?? true,
    knowledgeDoc: row.knowledge_doc ?? undefined,
  };
}

async function query(active: boolean | null): Promise<Benefit[] | null> {
  const supabase = createClient();
  if (!supabase) return null;
  let q = supabase.from("benefits").select("*");
  if (active !== null) q = q.eq("active", active);
  const { data, error } = await q.order("name_zh");
  if (error || !data || data.length === 0) return null;
  return data.map(rowToBenefit);
}

export async function fetchActiveBenefitsFromDb(): Promise<Benefit[] | null> {
  return query(true);
}

export async function fetchAllBenefitsFromDb(): Promise<Benefit[] | null> {
  return query(null);
}

export async function fetchBenefitFromDb(id: string): Promise<Benefit | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("benefits")
    .select("*")
    .or(`id.eq.${id},slug.eq.${id}`)
    .maybeSingle();
  if (error || !data) return null;
  return rowToBenefit(data);
}
