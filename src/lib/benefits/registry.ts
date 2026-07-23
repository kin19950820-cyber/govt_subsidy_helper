import data from "./benefits.generated.json";
import { Benefit, BenefitQuery, Category, LifeEvent } from "./types";

// 由 build-benefits.mjs 產生嘅單一資料來源（content/benefits/*.json 匯總）。
const CATEGORIES = data.categories as Category[];
const LIFE_EVENTS = data.lifeEvents as LifeEvent[];
const BENEFITS = data.benefits as unknown as Benefit[];

export function getAllBenefits(): Benefit[] {
  return BENEFITS;
}

// active 且未封存（archived）先會出現喺搜尋 / 配對。
export function getActiveBenefits(): Benefit[] {
  return BENEFITS.filter((b) => b.active && !b.archived);
}

// 已封存（已完結）計劃：唔會喺一般搜尋出現，但可經直接連結存取。
export function getArchivedBenefits(): Benefit[] {
  return BENEFITS.filter((b) => b.archived);
}

export function getBenefitBySlug(slug: string): Benefit | undefined {
  return BENEFITS.find((b) => b.slug === slug || b.id === slug);
}

export function getCategories(): Category[] {
  return [...CATEGORIES].sort((a, b) => a.sort - b.sort);
}

export function getCategory(code: string): Category | undefined {
  return CATEGORIES.find((c) => c.code === code);
}

export function getLifeEvents(): LifeEvent[] {
  return [...LIFE_EVENTS].sort((a, b) => a.sort - b.sort);
}

export function getLifeEvent(code: string): LifeEvent | undefined {
  return LIFE_EVENTS.find((e) => e.code === code);
}

// Faceted 搜尋：可按分類 / 人生階段 / 年齡 / 審查 / 身分 / 文字過濾。
// 新增 facet 只需喺 content JSON 加 key，毋須改呢度嘅結構。
export function queryBenefits(q: BenefitQuery = {}): Benefit[] {
  return getActiveBenefits().filter((b) => {
    if (q.categoryCode && b.categoryCode !== q.categoryCode) return false;
    if (q.lifeEvent && !b.lifeEvents.includes(q.lifeEvent)) return false;
    if (q.meansTested !== undefined && Boolean(b.facets?.means_tested) !== q.meansTested)
      return false;
    if (q.disability !== undefined && Boolean(b.facets?.disability) !== q.disability)
      return false;
    if (q.student !== undefined && Boolean(b.facets?.student) !== q.student) return false;
    if (q.elderly !== undefined && Boolean(b.facets?.elderly) !== q.elderly) return false;
    if (q.age !== undefined) {
      const min = b.facets?.age_min;
      const max = b.facets?.age_max;
      if (typeof min === "number" && q.age < min) return false;
      if (typeof max === "number" && q.age > max) return false;
    }
    if (q.text) {
      const hay = `${b.nameZh} ${b.nameEn} ${b.summary} ${b.eligibility.join(" ")}`.toLowerCase();
      if (!hay.includes(q.text.toLowerCase())) return false;
    }
    return true;
  });
}

// 每個分類有幾多項 active 福利（畀 UI 顯示）。
export function categoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const b of getActiveBenefits()) {
    counts[b.categoryCode] = (counts[b.categoryCode] ?? 0) + 1;
  }
  return counts;
}
