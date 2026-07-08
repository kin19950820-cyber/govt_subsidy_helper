import { SubsidyScheme } from "./types";
import { createClient } from "./supabase/server";
import {
  getActiveBenefits,
  getAllBenefits,
  getBenefitBySlug,
} from "./benefits/registry";
import { benefitToScheme } from "./benefits/adapter";

// 內容來源：content/benefits/*.json（經 registry）。未設定 Supabase 時，
// App 直接由呢個可擴充內容庫讀取，唔再依賴硬編碼陣列。
const activeFromContent = () => getActiveBenefits().map(benefitToScheme);
const allFromContent = () => getAllBenefits().map(benefitToScheme);
const byIdFromContent = (id: string) => {
  const b = getBenefitBySlug(id);
  return b ? benefitToScheme(b) : undefined;
};

// 將 DB row map 成 SubsidyScheme
function mapRow(row: any): SubsidyScheme {
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

// 取得所有 active schemes（公開可讀）。未設定 Supabase 時用靜態資料。
export async function getActiveSchemes(): Promise<SubsidyScheme[]> {
  const supabase = createClient();
  if (!supabase) {
    return activeFromContent();
  }
  const { data, error } = await supabase
    .from("subsidy_schemes")
    .select("*")
    .eq("active", true)
    .order("name_zh");

  if (error || !data) {
    return activeFromContent();
  }
  return data.map(mapRow);
}

// Admin：取得全部 schemes（包含 inactive）
export async function getAllSchemes(): Promise<SubsidyScheme[]> {
  const supabase = createClient();
  if (!supabase) {
    return allFromContent();
  }
  const { data, error } = await supabase
    .from("subsidy_schemes")
    .select("*")
    .order("name_zh");

  if (error || !data) return allFromContent();
  return data.map(mapRow);
}

export async function getSchemeById(
  id: string
): Promise<SubsidyScheme | undefined> {
  const supabase = createClient();
  if (!supabase) {
    return byIdFromContent(id);
  }
  const { data, error } = await supabase
    .from("subsidy_schemes")
    .select("*")
    .or(`id.eq.${id},slug.eq.${id}`)
    .maybeSingle();

  if (error || !data) {
    return byIdFromContent(id);
  }
  return mapRow(data);
}
