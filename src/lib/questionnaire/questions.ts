import {
  AGE_LABELS,
  ASSET_LABELS,
  GRADE_LABELS,
  INCOME_LABELS,
} from "../types";
import { ApplicantFactKey } from "../eligibility/facts";
import { Condition } from "../eligibility/rules";

export type AnswerType =
  | "yesno"
  | "single"
  | "multi"
  | "number"
  | "currency"
  | "date"
  | "text"
  | "district"
  | "income_band"
  | "asset_band";

export interface QuestionOption {
  value: string | number | boolean;
  labelZh: string;
  labelEn: string;
}

export interface Question {
  id: string; // 穩定 ID
  fact: ApplicantFactKey;
  labelZh: string;
  labelEn: string;
  helperYue?: string; // 廣東話輔助說明
  type: AnswerType;
  options?: QuestionOption[];
  sensitive?: boolean; // 敏感（盡量後問 / 可避免）
  importance?: number; // 1(低)–5(高)
  whyZh?: string; // 解釋點解要問
  whyEn?: string;
  showIf?: Condition[]; // 條件顯示（需已知事實成立）
  allowUnknown?: boolean; // 「我唔知道」（預設 true）
  allowSkip?: boolean; // 「唔想答」（預設 true）
}

const opts = (labels: Record<string, string>): QuestionOption[] =>
  Object.entries(labels).map(([value, labelZh]) => ({ value, labelZh, labelEn: value }));

// 問卷題庫：以 ApplicantFactKey 為索引，可由多個福利共用。
// 不會為每個福利維護獨立硬編碼問卷。
export const QUESTIONS: Question[] = [
  {
    id: "q_hk_resident",
    fact: "hkResident",
    labelZh: "你係咪香港居民？",
    labelEn: "Are you a Hong Kong resident?",
    type: "yesno",
    importance: 4,
    whyZh: "大部分政府福利要求申請人為香港居民。",
    whyEn: "Most benefits require the applicant to be a HK resident.",
  },
  {
    id: "q_age_band",
    fact: "ageBand",
    labelZh: "你今年幾多歲？",
    labelEn: "How old are you?",
    type: "single",
    options: opts(AGE_LABELS),
    importance: 5,
    whyZh: "年齡決定長者、學生等福利是否適用。",
    whyEn: "Age gates elderly and student benefits.",
  },
  {
    id: "q_income_band",
    fact: "incomeBand",
    labelZh: "家庭每月總收入大約幾多？",
    labelEn: "Roughly what is your household monthly income?",
    type: "income_band",
    options: opts(INCOME_LABELS),
    sensitive: true,
    importance: 5,
    whyZh: "很多資助設有入息審查。",
    whyEn: "Many schemes are means-tested.",
  },
  {
    id: "q_asset_band",
    fact: "assetBand",
    labelZh: "你嘅資產（存款等）大約幾多？",
    labelEn: "Roughly what are your assets?",
    type: "asset_band",
    options: opts(ASSET_LABELS),
    sensitive: true,
    importance: 3,
    whyZh: "部分長者及房屋計劃設有資產審查。",
    whyEn: "Some elderly/housing schemes test assets.",
    showIf: [{ fact: "ageBand", op: "in", value: ["65_69", "70_plus"] }],
  },
  {
    id: "q_on_cssa",
    fact: "onCssa",
    labelZh: "你屋企係咪正領取綜援？",
    labelEn: "Is your household receiving CSSA?",
    type: "yesno",
    importance: 4,
    whyZh: "綜援與部分計劃不可同時領取。",
    whyEn: "CSSA is mutually exclusive with some schemes.",
  },
  {
    id: "q_has_disability",
    fact: "hasDisability",
    labelZh: "你有冇殘疾或長期病？",
    labelEn: "Do you have a disability or chronic illness?",
    type: "yesno",
    importance: 4,
    whyZh: "殘疾支援及傷殘津貼需要此資料。",
    whyEn: "Needed for disability support and allowances.",
  },
  {
    id: "q_education_level",
    fact: "educationLevel",
    labelZh: "你（或子女）就讀邊個階段？",
    labelEn: "Which education level (you or your child)?",
    type: "single",
    options: opts(GRADE_LABELS),
    importance: 4,
    whyZh: "學生資助按教育階段而定。",
    whyEn: "Student aid depends on education level.",
  },
  {
    id: "q_needs_travel",
    fact: "needsTravelSupport",
    labelZh: "你需唔需要交通費支援？",
    labelEn: "Do you need travel-cost support?",
    type: "yesno",
    importance: 2,
    whyZh: "用於車船津貼等交通支援。",
    whyEn: "For travel subsidies.",
  },
  {
    id: "q_needs_internet",
    fact: "needsInternetSupport",
    labelZh: "你需唔需要上網費支援？",
    labelEn: "Do you need internet-cost support?",
    type: "yesno",
    importance: 2,
    whyZh: "用於上網費津貼。",
    whyEn: "For internet subsidy.",
  },
  {
    id: "q_needs_medical",
    fact: "needsMedicalSupport",
    labelZh: "你需唔需要醫療費支援？",
    labelEn: "Do you need medical-cost support?",
    type: "yesno",
    importance: 2,
    whyZh: "用於醫療券及費用減免。",
    whyEn: "For health vouchers and fee waivers.",
  },
  {
    id: "q_single_parent",
    fact: "singleParent",
    labelZh: "你係咪單親家庭？",
    labelEn: "Are you a single-parent family?",
    type: "yesno",
    importance: 2,
    whyZh: "部分家庭支援會優先處理。",
    whyEn: "Some family support prioritises single parents.",
  },
  {
    id: "q_living_arrangement",
    fact: "livingArrangement",
    labelZh: "你嘅居住安排？",
    labelEn: "Your living arrangement?",
    type: "single",
    options: [
      { value: "alone", labelZh: "獨居", labelEn: "Alone" },
      { value: "with_family", labelZh: "與家人同住", labelEn: "With family" },
      { value: "institution", labelZh: "院舍", labelEn: "Institution" },
      { value: "other", labelZh: "其他", labelEn: "Other" },
    ],
    importance: 2,
    whyZh: "獨居長者部分服務會優先。",
    whyEn: "Some services prioritise elders living alone.",
    showIf: [{ fact: "ageBand", op: "in", value: ["65_69", "70_plus"] }],
  },
];

export const QUESTION_BY_FACT: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.fact, q])
);
