import { z } from "zod";
import { RuleGroupSchema } from "../eligibility/schema";

// Zod 內容契約：content/benefits/*.json 及 content/taxonomy/*.json 嘅單一驗證來源。
// 由 tests（content.test.ts）使用，將來亦可畀 build script / API 共用。
// 設計為寬鬆（strip 未知欄位），但強制核心欄位存在及型別正確。

export const BenefitDocumentSchema = z.object({
  label: z.string().min(1),
  key: z.string().optional(),
  required: z.boolean().optional(),
  note: z.string().optional(),
});

export const BenefitStepSchema = z.object({
  order: z.number(),
  text: z.string().min(1),
});

export const BenefitFormSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  url: z.string().url(),
  checksum: z.string().optional(),
  note: z.string().optional(),
});

export const BenefitSourceSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  published_date: z.string().optional(),
  note: z.string().optional(),
});

export const BenefitFaqSchema = z.object({
  q: z.string(),
  a: z.string(),
  source_url: z.string().optional(),
});

export const BenefitRuleSchema = z.object({
  field: z.string(),
  operator: z.enum(["equals", "in", "not_in", "gte", "lte", "exists"]),
  value: z.unknown().optional(),
  source_url: z.string().optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  needs_review: z.boolean().optional(),
});

export const BenefitStatusSchema = z.enum(["verified", "needs_review", "draft"]);

export const BenefitSchema = z.object({
  // core (required for every benefit)
  id: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be kebab-case"),
  nameZh: z.string().min(1),
  nameEn: z.string().min(1),
  department: z.string().min(1),
  categoryCode: z.string().min(1),
  lifeEvents: z.array(z.string()),
  summary: z.string().min(1),
  eligibility: z.array(z.string()),
  documents: z.array(BenefitDocumentSchema),
  steps: z.array(BenefitStepSchema),
  officialUrl: z.string().url(),
  disclaimer: z.string().min(1),
  status: BenefitStatusSchema,
  active: z.boolean(),
  facets: z.record(z.string(), z.unknown()),
  // optional / extensible
  audience: z.array(z.string()).optional(),
  matchRule: z.record(z.string(), z.unknown()).optional(),
  purpose: z.string().optional(),
  targetBeneficiaries: z.string().optional(),
  suitableFor: z.string().optional(),
  notSuitableFor: z.string().optional(),
  meansTest: z.string().optional(),
  residencyRequirement: z.string().optional(),
  incomeRequirement: z.string().optional(),
  assetRequirement: z.string().optional(),
  ageRequirement: z.string().optional(),
  employmentRequirement: z.string().optional(),
  studentRequirement: z.string().optional(),
  applicationMethod: z.string().optional(),
  onlineUrl: z.string().optional(),
  formUrl: z.string().optional(),
  guidanceUrl: z.string().optional(),
  faqUrl: z.string().optional(),
  processingTime: z.string().optional(),
  renewal: z.string().optional(),
  appeal: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  sourceUrl: z.string().optional(),
  lastUpdated: z.string().optional(),
  forms: z.array(BenefitFormSchema).optional(),
  sources: z.array(BenefitSourceSchema).optional(),
  faq: z.array(BenefitFaqSchema).optional(),
  rules: z.array(BenefitRuleSchema).optional(),
  ruleSet: RuleGroupSchema.optional(),
  relatedSlugs: z.array(z.string()).optional(),
  knowledgeDoc: z.string().optional(),
});

// ---------- taxonomy ----------
export const CategorySchema = z.object({
  code: z.string().min(1),
  name_zh: z.string().min(1),
  name_en: z.string().optional(),
  icon: z.string().optional(),
  sort: z.number(),
});
export const LifeEventSchema = z.object({
  code: z.string().min(1),
  name_zh: z.string().min(1),
  name_en: z.string().optional(),
  sort: z.number(),
});
export const BeneficiaryGroupSchema = LifeEventSchema;
export const DocumentTypeSchema = LifeEventSchema;
export const DepartmentSchema = z.object({
  code: z.string().min(1),
  name_zh: z.string().min(1),
  name_en: z.string().optional(),
  official_url: z.string().url().optional(),
  sort: z.number(),
});

export type ValidatedBenefit = z.infer<typeof BenefitSchema>;
export type ValidatedCategory = z.infer<typeof CategorySchema>;
export type ValidatedLifeEvent = z.infer<typeof LifeEventSchema>;
