// 通用「福利 / 公共服務」內容模型。
// 設計目標：可容納 300+ 項政府福利而毋須改變結構。
// 資料來源：content/benefits/*.json（單一福利一個檔案）→ 由 scripts/build-benefits.mjs
// 匯總成 benefits.generated.json 供 App 匯入。知識庫（knowledge/*.md）為研究來源。

export type ConfidenceLevel = "high" | "medium" | "low";

// 分類 / 人生階段 taxonomy（見 content/taxonomy/*.json）
export interface Category {
  code: string;
  name_zh: string;
  name_en: string;
  icon?: string;
  sort: number;
}

export interface LifeEvent {
  code: string;
  name_zh: string;
  name_en: string;
  sort: number;
}

// 機讀資格規則（用於配對 / faceted 搜尋）
export interface BenefitRule {
  field: string;
  operator: "equals" | "in" | "not_in" | "gte" | "lte" | "exists";
  value: unknown;
  source_url?: string;
  confidence?: ConfidenceLevel;
  needs_review?: boolean;
}

// 可擴充嘅搜尋面向（facets）—— 新面向只需加 key，毋須改結構。
export interface BenefitFacets {
  means_tested?: boolean;
  income_tested?: boolean;
  asset_tested?: boolean;
  age_min?: number | null;
  age_max?: number | null;
  disability?: boolean;
  student?: boolean;
  elderly?: boolean;
  // 自由標籤：occupation / household_type / housing_status / employment_status …
  household_type?: string[];
  housing_status?: string[];
  employment_status?: string[];
  tags?: string[];
  [key: string]: unknown;
}

export interface BenefitDocument {
  label: string;
  key?: string; // 對應舊 DocumentKey，用於合併文件清單
  required?: boolean;
  conditional?: boolean; // 條件性（如適用）
  providedBy?: string; // 由誰提供
  alternatives?: string[]; // 可接受替代文件
  note?: string;
  sourceRef?: string; // 官方來源
}

// 福利類型（明確區分現金津貼 / 服務 / 稅務等）
export type SchemeType =
  | "cash_allowance"
  | "fee_waiver"
  | "subsidised_service"
  | "screening_programme"
  | "clinical_programme"
  | "voucher"
  | "loan"
  | "tax_relief"
  | "housing_application"
  | "service";

export type SourceType =
  | "official_page"
  | "application_page"
  | "form"
  | "guidance_note"
  | "faq"
  | "press_release"
  | "legislation";

// 金額（易變 → 必須帶 effective date + source）
export interface BenefitAmount {
  label: string;
  value?: string;
  rate?: "full" | "partial" | "flat";
  frequency?: string;
  method?: string;
  effectiveFrom?: string;
  source?: string;
  lastVerified?: string;
  expiresOn?: string;
  changesAnnually?: boolean;
}

export interface ChangeLogEntry {
  date: string;
  change: string;
  source?: string;
}

export interface BenefitForm {
  name: string;
  type?: string; // pdf / online / link
  url: string;
  note?: string;
}

export interface BenefitSource {
  url: string;
  title?: string;
  titleZh?: string;
  titleEn?: string;
  published_date?: string;
  publisher?: string;
  sourceType?: SourceType;
  retrievedAt?: string;
  lastCheckedAt?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  contentHash?: string;
  status?: "active" | "redirected" | "broken" | "superseded";
  note?: string;
}

export interface BenefitFaq {
  q: string;
  a: string;
  source_url?: string;
}

export interface BenefitStep {
  order: number;
  text: string;
}

// 一項福利（對應資料庫 benefits + 其子表）
export interface Benefit {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  department: string;
  categoryCode: string;
  lifeEvents: string[];
  audience?: string[]; // 受惠群組（相容舊 AudienceGroup）
  matchRule?: Record<string, unknown>; // 配對規則（相容舊 EligibilityRule）

  // 敘述性欄位
  purpose: string;
  targetBeneficiaries: string;
  summary: string;
  suitableFor?: string;
  notSuitableFor?: string;
  eligibility: string[];

  // 結構化資格描述（任務要求逐項）
  meansTest?: string;
  residencyRequirement?: string;
  incomeRequirement?: string;
  assetRequirement?: string;
  ageRequirement?: string;
  employmentRequirement?: string;
  studentRequirement?: string;

  // 申請
  documents: BenefitDocument[];
  steps: BenefitStep[];
  applicationMethod?: string;
  onlineUrl?: string;
  formUrl?: string;
  guidanceUrl?: string;
  faqUrl?: string;
  processingTime?: string;
  renewal?: string;
  appeal?: string;

  // 聯絡 / 來源
  contactPhone?: string;
  contactEmail?: string;
  officialUrl: string;
  sourceUrl?: string;
  lastUpdated?: string;

  // 子集合
  forms: BenefitForm[];
  sources: BenefitSource[];
  faq: BenefitFaq[];
  rules: BenefitRule[];
  ruleSet?: import("../eligibility/rules").RuleGroup; // C1：可組合規則集（引擎用）
  facets: BenefitFacets;

  // ---- D1：資料完整度擴充（全部可選，向後相容） ----
  // 識別
  aliases?: string[];
  cantoneseNames?: string[]; // 俗名（生果金、長生津…）
  formerNames?: string[];
  abbreviations?: string[];
  schemeType?: SchemeType;
  // 資格
  exclusions?: string[];
  conflictingBenefits?: string[];
  overlappingBenefits?: string[];
  incomeMethodology?: string;
  assetMethodology?: string;
  specialCases?: string[];
  // 金額 / 服務
  amounts?: BenefitAmount[];
  benefitType?: string;
  // 申請
  applicationMethods?: string[];
  formNumber?: string;
  applicationPeriod?: string;
  deadline?: string;
  submissionAddress?: string;
  submissionChannels?: string[];
  noApplicationRequired?: boolean; // 自動 / 毋須申請
  // 聯絡
  serviceUnit?: string;
  hotline?: string;
  officeAddress?: string;
  officeHours?: string;
  appointmentRequired?: boolean;
  uses1823?: boolean;
  // 核實
  verifiedBy?: string;
  nextReviewDate?: string;
  reviewFrequency?: string;
  knownUncertainty?: string[];
  researchNotes?: string;
  changeLog?: ChangeLogEntry[];
  // 生命周期
  archived?: boolean;
  relatedSlugs: string[];

  // 中繼
  disclaimer: string;
  status: "verified" | "needs_review" | "draft";
  active: boolean;
  knowledgeDoc?: string; // 對應 knowledge/<file>.md
}

// 搜尋 / 過濾條件（faceted search）
export interface BenefitQuery {
  categoryCode?: string;
  lifeEvent?: string;
  age?: number;
  meansTested?: boolean;
  disability?: boolean;
  student?: boolean;
  elderly?: boolean;
  text?: string;
}
