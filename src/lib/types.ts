// 共用型別定義

export type GradeLevel = "kindergarten" | "primary" | "secondary" | "tertiary";

export const GRADE_LABELS: Record<GradeLevel, string> = {
  kindergarten: "幼稚園",
  primary: "小學",
  secondary: "中學",
  tertiary: "大專",
};

// 家庭每月收入範圍（港元）
export type IncomeBand =
  | "below_10k"
  | "10k_20k"
  | "20k_30k"
  | "30k_40k"
  | "above_40k";

export const INCOME_LABELS: Record<IncomeBand, string> = {
  below_10k: "$10,000 以下",
  "10k_20k": "$10,000 – $20,000",
  "20k_30k": "$20,000 – $30,000",
  "30k_40k": "$30,000 – $40,000",
  above_40k: "$40,000 以上",
};

// 問卷答案
export interface FinderAnswers {
  householdSize: number;
  studentCount: number;
  gradeLevels: GradeLevel[];
  onCssa: boolean; // 是否領取綜援
  incomeBand: IncomeBand;
  singleParent: boolean; // 單親家庭
  newArrival: boolean; // 新來港家庭
  hasSen: boolean; // 殘疾 / 特殊教育需要
  needTravelSupport: boolean; // 需要交通費支援
  needInternetSupport: boolean; // 需要上網費支援
}

// 文件類別（用於合併文件清單）
export type DocumentKey =
  | "applicant_id"
  | "student_id"
  | "student_proof"
  | "address_proof"
  | "income_proof"
  | "bank_account"
  | "tenancy_agreement"
  | "cssa_proof";

export const DOCUMENT_LABELS: Record<DocumentKey, string> = {
  applicant_id: "申請人身份證",
  student_id: "學生身份證 / 出世紙",
  student_proof: "學生證明（學校信 / 收生紙）",
  address_proof: "住址證明",
  income_proof: "入息證明",
  bank_account: "銀行戶口資料",
  tenancy_agreement: "租單 / 租約（如適用）",
  cssa_proof: "綜援證明（如適用）",
};

// 申請步驟（兒童友善）
export interface SchemeStep {
  order: number;
  text: string;
}

// 配對規則（儲存喺 DB，可由 admin 編輯）
export interface EligibilityRule {
  // 適合邊類年級
  gradeLevels?: GradeLevel[];
  // 收入上限（band），收入低於或等於此 band 視為符合
  maxIncomeBand?: IncomeBand;
  // 是否需要綜援
  requiresCssa?: boolean;
  // 綜援家庭是否不適用（例如書簿津貼 vs 綜援二選一）
  excludeIfCssa?: boolean;
  // 是否同交通支援有關
  travelRelated?: boolean;
  // 是否同上網支援有關
  internetRelated?: boolean;
  // 加分條件（提高配對信心）
  boostSingleParent?: boolean;
  boostNewArrival?: boolean;
  boostSen?: boolean;
}

export interface SubsidyScheme {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  category: string;
  summary: string; // 簡單說明
  suitableFor: string; // 適合邊類家庭
  notSuitableFor: string; // 不適合邊類家庭
  eligibility: string[]; // 申請資格
  documents: DocumentKey[]; // 需要文件
  steps: SchemeStep[]; // 申請步驟
  officialUrl: string; // 官方連結
  formUrl: string; // 表格連結
  department: string; // 負責部門
  phone: string; // 查詢電話
  lastVerified: string; // 最後更新日期 (YYYY-MM-DD)
  disclaimer: string; // 免責聲明
  rule: EligibilityRule; // 配對規則
  active: boolean;
}

export type MatchLevel = "very_likely" | "likely" | "unlikely" | "consult";

export const MATCH_LABELS: Record<MatchLevel, string> = {
  very_likely: "很可能適合",
  likely: "可能適合",
  unlikely: "未必適合",
  consult: "建議查詢社工 / 學校",
};

export const MATCH_COLORS: Record<MatchLevel, string> = {
  very_likely: "bg-green-100 text-green-800 border-green-300",
  likely: "bg-lime-100 text-lime-800 border-lime-300",
  unlikely: "bg-amber-100 text-amber-800 border-amber-300",
  consult: "bg-sky-100 text-sky-800 border-sky-300",
};

export interface MatchResult {
  scheme: SubsidyScheme;
  level: MatchLevel;
  reasons: string[];
}

// Profile 相關
export interface Profile {
  id: string;
  applicantName: string | null;
  idNumberPartial: string | null;
  phone: string | null;
  address: string | null;
  schoolName: string | null;
  bankAccount: string | null;
  incomeBand: IncomeBand | null;
}

export interface HouseholdMember {
  id: string;
  name: string;
  relationship: string;
}

export interface Student {
  id: string;
  name: string;
  gradeLevel: GradeLevel;
  schoolName: string | null;
}

export interface ApplicationDraft {
  id: string;
  schemeId: string;
  schemeNameZh: string;
  status: string;
  createdAt: string;
}

export interface ApplicationDraftField {
  fieldKey: string;
  fieldLabel: string;
  fieldValue: string;
}
