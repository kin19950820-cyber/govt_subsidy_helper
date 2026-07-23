# Benefit Content Standard

Every benefit lives in `content/benefits/<slug>.json`, validated by Zod
(`src/lib/benefits/schema.ts`) and scored by `scripts/completeness-core.mjs`.

## Critical fields (a `verified` record MUST have all — build fails otherwise)

`officialName` (nameZh) · `department` · `officialSource` (officialUrl or a
`sources[].url`) · `eligibilitySummary` (`eligibility[]` non-empty) ·
`structuredEligibility` (`ruleSet` or `matchRule` or `rules[]`) ·
`applicationMethod` (`applicationMethod`/`steps[]`/`applicationMethods[]` **or**
`noApplicationRequired: true`) · `lastVerified` (`lastUpdated`) ·
`verificationStatus` (`status`) · `disclaimer`.

`needs_review` records may miss fields (build continues; CI reports them).

## Recommended fields

`nameEn` · `summary` · `suitableFor`/`targetBeneficiaries` · contact
(`contactPhone`/`hotline`) · `documents[]` · `faq[]` · typed `sources[]`
(with `sourceType`) · dated `amounts[]`.

## Volatile values — never timeless

Amounts/thresholds go in `amounts[]`; **each entry must carry `effectiveFrom`
and `source`** (test-enforced). Also model `changesAnnually`, `expiresOn`.
Historical values are preserved via `changeLog[]`, not overwritten silently.

## Scheme type (model it explicitly)

`schemeType`: `cash_allowance | fee_waiver | subsidised_service |
screening_programme | clinical_programme | voucher | loan | tax_relief |
housing_application | service`. **Tax reliefs reduce assessable income/tax — they
are not cash subsidies.** Don't treat every public service as a subsidy.

## Sources

`sources[]`: `{ url, titleZh?, titleEn?, publisher, sourceType, retrievedAt,
lastCheckedAt, effectiveFrom?, effectiveTo?, contentHash?, status }`. Prefer the
scheme owner's official page over general GovHK summaries. Never mark `verified`
from a news article or third-party summary.

## Verification & lifecycle

`status` (`verified | needs_review | draft`), `lastUpdated`, `verifiedBy`,
`nextReviewDate`, `reviewFrequency`, `knownUncertainty[]`, `researchNotes`,
`changeLog[]`. Closed schemes set `archived: true` — excluded from discovery and
matching, reachable by direct URL only.

## Reports

`npm run completeness` → `reports/benefit-content-completeness.{json,md}`.
`npm run check:criticals` (runs in `prebuild`) fails the build if any `verified`
record misses a critical field.
