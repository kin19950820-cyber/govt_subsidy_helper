// 共用型別。
// 每個抽取出嚟嘅事實都必須帶 source_url + last_checked_at + confidence + needs_review。

export type Confidence = "high" | "medium" | "low";

// 一個帶來源 / 信心標記嘅欄位值
export interface Field<T> {
  value: T;
  confidence: Confidence;
  needs_review: boolean;
  source_url: string;
}

export type EducationLevel =
  | "kindergarten"
  | "primary"
  | "secondary"
  | "tertiary";

export type Language = "zh" | "en" | "bilingual" | "unknown";

// ---------- 爬蟲 ----------
export interface CrawlPageRecord {
  url: string;
  status: number;
  content_type: string;
  title: string;
  depth: number;
  fetched_at: string;
  html_snapshot_path: string | null;
  text_path: string | null;
  internal_links: string[];
  pdf_links: string[];
  error?: string;
}

export interface DownloadedFile {
  file_name: string;
  file_type: string; // pdf / doc / xls / unknown
  source_url: string;
  found_on_url: string;
  downloaded_at: string;
  scheme_name: string | null;
  academic_year: string | null;
  language: Language;
  checksum: string; // sha256
  bytes: number;
  saved_path: string;
}

// ---------- 機讀規則 ----------
export type RuleOperator =
  | "equals"
  | "in"
  | "not_in"
  | "gte"
  | "lte"
  | "exists";

export interface EligibilityRule {
  field: string;
  operator: RuleOperator;
  value: unknown;
  source_url: string;
  confidence: Confidence;
  needs_review: boolean;
}

export interface SchemeRuleSet {
  scheme_code: string;
  rules: EligibilityRule[];
  manual_review_notes: string[];
}

// ---------- Scheme（已抽取，帶來源標記） ----------
export interface ExtractedScheme {
  scheme_code: string;
  name_zh: Field<string>;
  name_en: Field<string>;
  responsible_department: Field<string>;
  target_applicants: Field<string>;
  education_level: Field<EducationLevel[]>;
  eligibility_criteria: Field<string[]>;
  means_test_requirement: Field<string>;
  residency_requirement: Field<string>;
  student_status_requirement: Field<string>;
  household_requirement: Field<string>;
  application_period: Field<string>;
  application_method: Field<string>;
  required_documents: Field<string[]>;
  submission_channel: Field<string>;
  approval_timeline: Field<string>;
  payment_arrangement: Field<string>;
  enquiry_phone: Field<string>;
  enquiry_email: Field<string>;
  official_page_url: Field<string>;
  form_url: Field<string>;
  notes: Field<string[]>;
  child_friendly: ChildFriendly;
  rule_set: SchemeRuleSet;
  last_checked_at: string;
}

// ---------- 兒童友善解釋 ----------
export interface ChildFriendly {
  what_helps: string; // 呢個資助幫到咩？
  who_can_apply: string; // 邊啲人可能申請到？
  what_to_prepare: string; // 要準備咩？
  how_to_apply: string; // 點樣申請？
  after_apply: string; // 申請之後會點？
  when_money: string; // 幾時收到錢？
  who_to_ask: string; // 有問題可以問邊個？
}

// ---------- 詞彙表 ----------
export interface TermEntry {
  term_en: string;
  term_zh: string;
  simple_explanation_zh: string;
  source_url: string;
  last_checked_at: string;
}

// ---------- 來源審計 ----------
export interface SourceAuditEntry {
  url: string;
  type: "seed" | "page" | "pdf";
  status: number | null;
  fetched_at: string | null;
  notes: string;
}
