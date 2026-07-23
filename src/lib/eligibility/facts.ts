import { AgeBand, AssetBand, IncomeBand } from "../types";

// 正規化申請人資料（ApplicantFacts）。
// 全部欄位可選：欠缺 = 未知（unknown）。敏感資料只喺需要時先收集。
// 資格探索期間，切勿收集身份證號碼、銀行戶口或確切醫療診斷。

export interface ApplicantFacts {
  // ---- 身份與居住 ----
  age?: number;
  dateOfBirth?: string; // ISO YYYY-MM-DD
  hkResident?: boolean;
  rightOfAbode?: boolean;
  yearsOfResidence?: number;
  immigrationStatus?: string;
  ordinarilyResident?: boolean;
  livingInHongKong?: boolean;
  livingInGuangdongFujian?: "guangdong" | "fujian" | "no";

  // ---- 家庭 ----
  householdSize?: number;
  maritalStatus?:
    | "single"
    | "married"
    | "cohabiting"
    | "divorced"
    | "widowed"
    | "separated";
  singleParent?: boolean;
  dependentChildren?: number;
  elderlyDependants?: number;
  livingArrangement?: "alone" | "with_family" | "institution" | "other";
  newArrival?: boolean;

  // ---- 收入與資產（支援 scheme-specific 方法；勿假設單一門檻）----
  householdMonthlyIncome?: number;
  householdAnnualIncome?: number;
  adjustedFamilyIncome?: number;
  individualIncome?: number;
  liquidAssets?: number;
  totalHouseholdAssets?: number;
  ownsProperty?: boolean;
  onCssa?: boolean;
  onWfa?: boolean;
  incomeBand?: IncomeBand; // 粗略備用（與舊 finder 相容）
  assetBand?: AssetBand;

  // ---- 教育 ----
  isStudent?: boolean;
  educationLevel?: "kindergarten" | "primary" | "secondary" | "tertiary" | "none";
  schoolType?: "public" | "aided" | "dss" | "private" | "caput" | "other";
  fullTime?: boolean;
  courseLevel?: string;
  institutionType?: string;
  localProgramme?: boolean;
  needsTravelSupport?: boolean;
  needsInternetSupport?: boolean;
  journeyDistanceMinutes?: number;
  kindergartenParticipant?: boolean;

  // ---- 就業 ----
  employmentStatus?:
    | "employed"
    | "unemployed"
    | "underemployed"
    | "self_employed"
    | "retired"
    | "student"
    | "other";
  workingHoursPerMonth?: number;
  employmentDurationMonths?: number;
  jobSeeking?: boolean;
  retrainingInterest?: boolean;
  ageBand?: AgeBand;

  // ---- 健康與殘疾 ----
  hasDisability?: boolean;
  disabilityAssessed?: boolean;
  disabilitySeverity?: "none" | "normal" | "severe";
  chronicIllness?: boolean;
  hospitalDischarge?: boolean;
  longTermCareNeed?: boolean;
  inResidentialCare?: boolean;
  needsMedicalFeeWaiver?: boolean;
  needsMedicalSupport?: boolean;
  isCaregiver?: boolean;

  // ---- 房屋 ----
  prhTenant?: boolean;
  prhApplicant?: boolean;
  housingApplicantType?: "general" | "elderly";
  currentAccommodation?: string;
  housingHardship?: boolean;

  // ---- 交通與地區 ----
  needsStudentTravel?: boolean;
  elderlyTransportEligible?: boolean;
  district?: string;
  crossBoundaryResidence?: boolean;
  mobilityLimitation?: boolean;

  // ---- 稅務 ----
  taxpayer?: boolean;
  hasDependentParent?: boolean;
  hasDependentGrandparent?: boolean;
  hasDependentChild?: boolean;
  residentialCareExpense?: boolean;
  selfEducationExpense?: boolean;
  vhisPremiums?: boolean;
  mpfVoluntary?: boolean;
}

export type ApplicantFactKey = keyof ApplicantFacts;

// 敏感事實：問卷會標示，並只喺配對確實需要時先問。
export const SENSITIVE_FACTS: ReadonlySet<ApplicantFactKey> = new Set([
  "dateOfBirth",
  "immigrationStatus",
  "householdMonthlyIncome",
  "householdAnnualIncome",
  "adjustedFamilyIncome",
  "individualIncome",
  "liquidAssets",
  "totalHouseholdAssets",
  "disabilitySeverity",
  "chronicIllness",
  "district",
]);
