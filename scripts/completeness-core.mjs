// 確定性內容完整度評分（供 report + build gate + tests 共用）。
// 「已核實(verified)」記錄必須通過全部 critical 欄位。

export const CRITICAL_FIELDS = [
  "officialName",
  "department",
  "officialSource",
  "eligibilitySummary",
  "structuredEligibility",
  "applicationMethod",
  "lastVerified",
  "verificationStatus",
  "disclaimer",
];

const nonEmpty = (v) =>
  v !== undefined &&
  v !== null &&
  (typeof v !== "string" || v.trim() !== "") &&
  (!Array.isArray(v) || v.length > 0);

function hasSource(b) {
  return nonEmpty(b.officialUrl) || (Array.isArray(b.sources) && b.sources.some((s) => s && s.url));
}
function hasStructured(b) {
  return (
    (b.ruleSet && Object.keys(b.ruleSet).length > 0) ||
    (b.matchRule && Object.keys(b.matchRule).length > 0) ||
    (Array.isArray(b.rules) && b.rules.length > 0)
  );
}
function hasApplication(b) {
  return (
    nonEmpty(b.applicationMethod) ||
    (Array.isArray(b.steps) && b.steps.length > 0) ||
    b.noApplicationRequired === true ||
    (Array.isArray(b.applicationMethods) && b.applicationMethods.length > 0)
  );
}

export function scoreBenefit(b) {
  const criticals = {
    officialName: nonEmpty(b.nameZh),
    department: nonEmpty(b.department),
    officialSource: hasSource(b),
    eligibilitySummary: Array.isArray(b.eligibility) && b.eligibility.length > 0,
    structuredEligibility: hasStructured(b),
    applicationMethod: hasApplication(b),
    lastVerified: nonEmpty(b.lastUpdated),
    verificationStatus: nonEmpty(b.status),
    disclaimer: nonEmpty(b.disclaimer),
  };
  const criticalMissing = CRITICAL_FIELDS.filter((k) => !criticals[k]);

  const amountsDated =
    !Array.isArray(b.amounts) ||
    b.amounts.length === 0 ||
    b.amounts.every((a) => nonEmpty(a.effectiveFrom) && nonEmpty(a.source));

  const recommended = {
    nameEn: nonEmpty(b.nameEn),
    summary: nonEmpty(b.summary),
    audienceOrTarget: nonEmpty(b.suitableFor) || nonEmpty(b.targetBeneficiaries),
    contact: nonEmpty(b.contactPhone) || nonEmpty(b.hotline),
    documents: Array.isArray(b.documents) && b.documents.length > 0,
    faq: Array.isArray(b.faq) && b.faq.length > 0,
    typedSources: Array.isArray(b.sources) && b.sources.some((s) => s && s.sourceType),
    amountsDated,
  };
  const recMissing = Object.keys(recommended).filter((k) => !recommended[k]);

  const sourceCoverage = hasSource(b)
    ? Array.isArray(b.sources) && b.sources.some((s) => s && s.sourceType)
      ? 1
      : 0.6
    : 0;
  const eligibilityRuleCoverage = hasStructured(b) ? 1 : 0;
  const applicationInfoCoverage = hasApplication(b) ? 1 : 0;
  const documentInfoCoverage = recommended.documents ? 1 : 0;

  const criticalPass = CRITICAL_FIELDS.length - criticalMissing.length;
  const recPass = Object.keys(recommended).length - recMissing.length;
  const covAvg =
    (sourceCoverage + eligibilityRuleCoverage + applicationInfoCoverage + documentInfoCoverage) / 4;

  const score = Math.round(
    100 *
      ((criticalPass / CRITICAL_FIELDS.length) * 0.6 +
        (recPass / Object.keys(recommended).length) * 0.25 +
        covAvg * 0.15)
  );

  return {
    slug: b.slug,
    nameZh: b.nameZh,
    status: b.status,
    archived: b.archived === true,
    score,
    criticalMissing,
    recommendedMissing: recMissing,
    sourceCoverage,
    eligibilityRuleCoverage,
    applicationInfoCoverage,
    documentInfoCoverage,
  };
}
