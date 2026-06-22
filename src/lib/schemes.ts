import { SubsidyScheme } from "./types";
import { SCHEMES, getSchemeById as getStaticSchemeById } from "./schemes-data";
import { createClient } from "./supabase/server";

// 將 DB row map 成 SubsidyScheme
function mapRow(row: any): SubsidyScheme {
  return {
    id: row.id,
    slug: row.slug,
    nameZh: row.name_zh,
    nameEn: row.name_en,
    category: row.category ?? "",
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

// 取得所有 active schemes（公開可讀）。未設定 Supabase 時用靜態資料。
export async function getActiveSchemes(): Promise<SubsidyScheme[]> {
  const supabase = createClient();
  if (!supabase) {
    return SCHEMES.filter((s) => s.active);
  }
  const { data, error } = await supabase
    .from("subsidy_schemes")
    .select("*")
    .eq("active", true)
    .order("name_zh");

  if (error || !data) {
    return SCHEMES.filter((s) => s.active);
  }
  return data.map(mapRow);
}

// Admin：取得全部 schemes（包含 inactive）
export async function getAllSchemes(): Promise<SubsidyScheme[]> {
  const supabase = createClient();
  if (!supabase) {
    return SCHEMES;
  }
  const { data, error } = await supabase
    .from("subsidy_schemes")
    .select("*")
    .order("name_zh");

  if (error || !data) return SCHEMES;
  return data.map(mapRow);
}

export async function getSchemeById(
  id: string
): Promise<SubsidyScheme | undefined> {
  const supabase = createClient();
  if (!supabase) {
    return getStaticSchemeById(id);
  }
  const { data, error } = await supabase
    .from("subsidy_schemes")
    .select("*")
    .or(`id.eq.${id},slug.eq.${id}`)
    .maybeSingle();

  if (error || !data) {
    return getStaticSchemeById(id);
  }
  return mapRow(data);
}
