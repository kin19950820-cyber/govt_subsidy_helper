import { SubsidyScheme } from "./types";
import {
  getActiveBenefits,
  getAllBenefits,
  getBenefitBySlug,
} from "./benefits/registry";
import { benefitToScheme } from "./benefits/adapter";
import {
  fetchActiveBenefitsFromDb,
  fetchAllBenefitsFromDb,
  fetchBenefitFromDb,
} from "./benefits/db";

// 單一權威來源（Batch B）：
//   1) 若已設定 Supabase 且 public.benefits 有資料 → 讀 DB。
//   2) 否則 fallback 去 content registry（content/benefits/*.json）。
// 已不再讀取舊 public.subsidy_schemes 或硬編碼 schemes-data.ts。

const activeFromContent = () => getActiveBenefits().map(benefitToScheme);
const allFromContent = () => getAllBenefits().map(benefitToScheme);
const byIdFromContent = (id: string) => {
  const b = getBenefitBySlug(id);
  return b ? benefitToScheme(b) : undefined;
};

export async function getActiveSchemes(): Promise<SubsidyScheme[]> {
  const fromDb = await fetchActiveBenefitsFromDb();
  if (fromDb) return fromDb.map(benefitToScheme);
  return activeFromContent();
}

export async function getAllSchemes(): Promise<SubsidyScheme[]> {
  const fromDb = await fetchAllBenefitsFromDb();
  if (fromDb) return fromDb.map(benefitToScheme);
  return allFromContent();
}

export async function getSchemeById(
  id: string
): Promise<SubsidyScheme | undefined> {
  const fromDb = await fetchBenefitFromDb(id);
  if (fromDb) return benefitToScheme(fromDb);
  return byIdFromContent(id);
}
