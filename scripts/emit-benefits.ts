// 一次性遷移：將 src/lib/schemes-data.ts 內嘅 17 項現有津貼，
// 轉成 content/benefits/<slug>.json（新嘅可擴充內容格式）。
// 執行：research-agent/node_modules/.bin/tsx scripts/emit-benefits.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEMES } from "../src/lib/schemes-data";
import { DOCUMENT_LABELS } from "../src/lib/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "content", "benefits");
fs.mkdirSync(outDir, { recursive: true });

const CAT: Record<string, string> = {
  "school-textbook-assistance": "student_assistance",
  "student-travel-subsidy": "student_assistance",
  "internet-access-subsidy": "student_assistance",
  "kindergarten-fee-remission": "student_assistance",
  "cssa-student-support": "social_security",
  "working-family-allowance": "employment",
  "old-age-living-allowance": "social_security",
  "old-age-allowance": "social_security",
  "elderly-health-care-voucher": "healthcare",
  "disability-allowance": "disability",
  "public-transport-subsidy": "elderly",
  "integrated-discharge-support-elderly": "rehab_community",
  "personal-emergency-link": "elderly",
  "community-care-service-voucher": "rehab_community",
  "home-care-services": "rehab_community",
  "guangdong-fujian-scheme": "social_security",
  "elderly-dental-assistance": "healthcare",
};

const LE: Record<string, string[]> = {
  "school-textbook-assistance": ["primary_school", "secondary_school", "low_income"],
  "student-travel-subsidy": ["primary_school", "secondary_school", "university", "low_income"],
  "internet-access-subsidy": ["kindergarten", "primary_school", "secondary_school", "low_income"],
  "kindergarten-fee-remission": ["new_baby", "kindergarten", "low_income"],
  "cssa-student-support": ["low_income", "unemployed", "single_parent"],
  "working-family-allowance": ["low_income", "job_seeking"],
  "old-age-living-allowance": ["retirement", "low_income"],
  "old-age-allowance": ["retirement"],
  "elderly-health-care-voucher": ["retirement"],
  "disability-allowance": ["disability_diagnosed"],
  "public-transport-subsidy": ["retirement", "disability_diagnosed"],
  "integrated-discharge-support-elderly": ["hospital_discharge", "long_term_care"],
  "personal-emergency-link": ["long_term_care", "retirement"],
  "community-care-service-voucher": ["long_term_care"],
  "home-care-services": ["long_term_care", "hospital_discharge"],
  "guangdong-fujian-scheme": ["retirement", "move_guangdong", "move_fujian"],
  "elderly-dental-assistance": ["retirement", "low_income"],
};

const KDOC: Record<string, string> = {
  "school-textbook-assistance": "textbook_assistance",
  "student-travel-subsidy": "travel_subsidy",
  "internet-access-subsidy": "internet_subsidy",
  "kindergarten-fee-remission": "kindergarten_fee_remission",
  "cssa-student-support": "cssa_student_support",
  "working-family-allowance": "working_family_allowance",
  "old-age-living-allowance": "old_age_living_allowance",
  "old-age-allowance": "old_age_allowance",
  "elderly-health-care-voucher": "elderly_health_care_voucher",
  "disability-allowance": "disability_allowance",
  "public-transport-subsidy": "public_transport_subsidy",
  "integrated-discharge-support-elderly": "integrated_discharge_support",
  "personal-emergency-link": "personal_emergency_link",
  "community-care-service-voucher": "community_care_service_voucher",
  "home-care-services": "home_care_services",
  "guangdong-fujian-scheme": "guangdong_fujian_scheme",
  "elderly-dental-assistance": "elderly_dental_assistance",
};

const VERIFIED = new Set([
  "old-age-living-allowance",
  "old-age-allowance",
  "disability-allowance",
  "elderly-health-care-voucher",
  "home-care-services",
  "guangdong-fujian-scheme",
]);

const AGE: Record<string, number | null> = {
  below_60: null,
  "60_64": 60,
  "65_69": 65,
  "70_plus": 70,
};

for (const s of SCHEMES) {
  const rule: any = s.rule ?? {};
  const facets = {
    means_tested: rule.meansTested === false ? false : Boolean(rule.maxIncomeBand || rule.maxAssetBand || rule.requiresCssa),
    income_tested: Boolean(rule.maxIncomeBand),
    asset_tested: Boolean(rule.maxAssetBand),
    age_min: rule.minAgeBand ? AGE[rule.minAgeBand] ?? null : null,
    disability: Boolean(rule.requiresDisability) || s.audience.includes("disability"),
    student: s.audience.includes("student"),
    elderly: Boolean(rule.requiresElderly) || s.audience.includes("elderly"),
    tags: s.audience,
  };

  const benefit = {
    id: s.id,
    slug: s.slug,
    nameZh: s.nameZh,
    nameEn: s.nameEn,
    department: s.department,
    categoryCode: CAT[s.slug] ?? "social_security",
    lifeEvents: LE[s.slug] ?? [],
    audience: s.audience,
    matchRule: rule,
    purpose: s.summary,
    targetBeneficiaries: s.suitableFor,
    summary: s.summary,
    suitableFor: s.suitableFor,
    notSuitableFor: s.notSuitableFor,
    eligibility: s.eligibility,
    meansTest: undefined,
    residencyRequirement: undefined,
    incomeRequirement: undefined,
    assetRequirement: undefined,
    ageRequirement: undefined,
    employmentRequirement: undefined,
    studentRequirement: undefined,
    documents: s.documents.map((k) => ({ key: k, label: DOCUMENT_LABELS[k], required: true })),
    steps: s.steps,
    applicationMethod: undefined,
    onlineUrl: undefined,
    formUrl: s.formUrl,
    guidanceUrl: undefined,
    faqUrl: undefined,
    processingTime: undefined,
    renewal: undefined,
    appeal: undefined,
    contactPhone: s.phone,
    contactEmail: undefined,
    officialUrl: s.officialUrl,
    sourceUrl: s.officialUrl,
    lastUpdated: s.lastVerified,
    forms: s.formUrl ? [{ name: "申請表 / 申請方式", type: "link", url: s.formUrl }] : [],
    sources: [{ url: s.officialUrl, title: `${s.nameZh} 官方頁面` }],
    faq: [],
    rules: [],
    facets,
    relatedSlugs: [],
    disclaimer: s.disclaimer,
    status: VERIFIED.has(s.slug) ? "verified" : "needs_review",
    active: s.active,
    knowledgeDoc: KDOC[s.slug] ? `${KDOC[s.slug]}.md` : undefined,
  };

  fs.writeFileSync(
    path.join(outDir, `${s.slug}.json`),
    JSON.stringify(benefit, null, 2) + "\n",
    "utf8"
  );
}

console.log(`Migrated ${SCHEMES.length} schemes -> content/benefits/`);
