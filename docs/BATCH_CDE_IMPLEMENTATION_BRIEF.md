# Batch C / D / E — Pre-implementation Brief

**Branch:** `claude/hk-subsidy-finder-app-9m98ia` @ `f312047`
**Prereqs done:** Batch A (Zod, taxonomy, Vitest, CI) · Batch B (Benefit canonical, SSG/ISR, verification gating). **Do not repeat/replace A or B.**
**Rule:** brief first (this doc), then implement in small, independently reversible commits (C1→E3). Draft PR at the end.

---

## 1. Current files & architecture (relevant to C/D/E)

- **Content model:** `content/benefits/*.json` (21) → `scripts/build-benefits.mjs` → `src/lib/benefits/benefits.generated.json` → `registry.ts`. Zod contract in `src/lib/benefits/schema.ts`. Taxonomy in `content/taxonomy/{categories,life_events,beneficiary_groups,document_types,departments}.json`.
- **Canonical read:** `src/lib/schemes.ts` → `public.benefits` (Supabase) else content registry; `benefitToScheme` adapter feeds the legacy `SubsidyScheme` UI. IDs/slugs stable.
- **Matching (legacy, to be superseded, not deleted):** `src/lib/matching.ts` — hand-written `if/else` scorer over `EligibilityRule` (`scheme.rule`), 4 levels (`very_likely/likely/unlikely/consult`), gated by `status.ts` (`canBeHighConfidence`). Consumed **client-side** in `src/app/results/page.tsx`.
- **Questionnaire (hardcoded):** `src/app/finder/page.tsx` — one client component, group-branched (`a.group === "student"` …) fixed questions writing `FinderAnswers` (`src/lib/types.ts`); persisted to `sessionStorage` via `finder-storage.ts`.
- **Verification:** `src/lib/benefits/status.ts` (`verified/needs_review/stale/inactive`, `STALE_AFTER_MONTHS=12`), `VerificationBadge.tsx`.
- **Tests:** `tests/{content,matching,matching-gating,status,adapter,parity}.test.ts` (103). CI in `.github/workflows/ci.yml`; link-check `scripts/check-links.mjs` (non-blocking job).
- **Research module:** `research-agent/` (standalone crawler) + `.claude/agents/kb-*` + `knowledge/*.md`.

## 2. Existing eligibility & questionnaire behaviour

- Finder: pick beneficiary **group** → fixed per-group questions → `matchSchemes(answers, schemes)` filters by `audience.includes(group)`, scores each via `evaluateScheme`, demotes unverified from `very_likely`. Output = `{scheme, level, reasons[]}`.
- Limitations: questions are hardcoded per group (not derived from rules); `EligibilityRule` is a flat bag of optional booleans/bands, not composable (no AND/OR/NOT, no nested groups, no explicit missing-facts, no numeric/date operators); outcome is a single level + ad-hoc reasons (no matched/failed/unknown breakdown, no confidence number, no missing-facts list); income is one generic `IncomeBand` for all schemes.

## 3. Data fields already supported (Benefit)

`id, slug, nameZh, nameEn, department, categoryCode, lifeEvents, audience, matchRule, purpose, targetBeneficiaries, summary, suitableFor, notSuitableFor, eligibility[], documents[{key,label,required}], steps[], formUrl, contactPhone, officialUrl, sourceUrl, lastUpdated, forms[], sources[], faq[], rules[] (mostly empty), facets, relatedSlugs, disclaimer, status, active, knowledgeDoc`. `sources[]` already has `{url,title,published_date,note}`. Optional structured fields (`meansTest, residencyRequirement, income/asset/age/employment/studentRequirement, applicationMethod, processingTime, renewal, appeal, contactEmail, guidanceUrl, faqUrl`) exist in `Benefit` type but are unused in content.

## 4. Missing information fields (to add — Batch D)

- **Identification:** `aliases[]`, `cantoneseNames[]`, `formerNames[]`, `schemeType` (cash_allowance | fee_waiver | subsidised_service | screening_programme | clinical_programme | loan | tax_relief | housing_application | service | voucher), `abbreviations[]`.
- **Eligibility:** structured `rules` (RuleGroup — Batch C), `exclusions[]`, `conflictingBenefits[]`, `overlappingBenefits[]`, income/asset **methodology** (scheme-specific), `specialCases[]`.
- **Benefit details:** `amounts[]` each `{label, value?, rate?(full/partial), frequency, method, effectiveFrom, source, lastVerified, expiresOn?, changesAnnually}` — **volatile amounts must carry effective date + source**.
- **Application:** `applicationMethods[]`, `onlineUrl, formUrl, formNumber, applicationPeriod, deadline, submissionAddress, submissionChannels[], processingTime, renewal, appeal`, plus explicit `noApplicationRequired` (automatic) flag.
- **Documents (structured):** `documents[]` extended to `{key, label, required|conditional, providedBy, alternatives[], note, sourceRef}`.
- **Contact:** `serviceUnit, hotline, email, officeAddress, officeHours, appointmentRequired, uses1823`.
- **Sources (extended):** `{url, titleZh?, titleEn?, publisher, sourceType, retrievedAt, lastCheckedAt, effectiveFrom?, effectiveTo?, contentHash?, status(active|redirected|broken|superseded)}`.
- **Verification:** `verifiedBy, nextReviewDate, reviewFrequency, knownUncertainty[], researchNotes, changeLog[]`.
- **Lifecycle:** `archived` (closed schemes) — excluded from discovery/matching, reachable by URL.

All added fields are **optional** in the Zod schema → existing 21 records stay valid (no forced migration).

## 5. Migration risks & mitigations

| Risk | Mitigation |
| --- | --- |
| New engine changes results vs legacy | Add engine **alongside** `matching.ts`; keep legacy path until C4; regression tests lock legacy behaviour |
| Schema expansion breaks existing content | All new fields **optional**; `content.test.ts` + build stay green; no data rewrite required |
| Questionnaire rewrite breaks saved finder answers | Keep `FinderAnswers` + `sessionStorage` key; new engine maps `FinderAnswers → ApplicantFacts` via an adapter (back-compat); old saved answers still load |
| Drafts / URLs / IDs depend on legacy model | IDs/slugs unchanged; `benefitToScheme` retained; drafts untouched |
| "verified requires all critical fields" build-fail could block CI on current data | Gate applies to `status: verified` only; if any current verified record lacks a critical field, either complete it or the build fails **by design** — I will complete criticals for the 6 verified records so the gate passes |
| Network flakiness (gov sites) fails CI | Link/source checks stay in a **separate, non-blocking** CI job; unit tests never hit network |
| Amount without effective-date shown as timeless | Completeness checker flags; verified gate requires effective date on amounts |

## 6. Exact files to add / modify (by sub-batch)

**C1 — ApplicantFacts + typed rule model**
- Add: `src/lib/eligibility/facts.ts` (ApplicantFacts type + `ApplicantFactKey`), `src/lib/eligibility/rules.ts` (RuleGroup/Condition types + operators), `src/lib/eligibility/schema.ts` (Zod for rules + facts), `src/lib/eligibility/factsFromFinder.ts` (FinderAnswers→ApplicantFacts adapter).
- Modify: `src/lib/benefits/schema.ts` (accept `RuleGroup` in `rules`), `src/lib/benefits/types.ts` (Benefit.rules typed).

**C2 — Evaluator + explanation**
- Add: `src/lib/eligibility/engine.ts` (`evaluate(facts, benefit) → EligibilityResult`), `src/lib/eligibility/outcome.ts` (outcome/confidence types + status gating), `src/lib/eligibility/reasons.ts` (zh/en reason text).
- Tests: `tests/rule-engine.test.ts`.

**C3 — Dynamic question registry + selection**
- Add: `src/lib/questionnaire/questions.ts` (question definitions keyed by `ApplicantFactKey`), `src/lib/questionnaire/select.ts` (question selection algorithm), `src/lib/questionnaire/schema.ts` (Zod).
- Tests: `tests/questionnaire.test.ts`.

**C4 — Questionnaire UI migration (backward compatible)**
- Add: `src/app/finder/DynamicFinder.tsx` (client) driven by question registry; `src/lib/questionnaire/storage.ts` (save/resume, revise).
- Modify: `src/app/finder/page.tsx` (render DynamicFinder), `src/app/results/page.tsx` (use engine results + explanations), keeping `FinderAnswers` bridge.

**D1 — Expanded Benefit schema + source model**
- Modify: `src/lib/benefits/types.ts`, `src/lib/benefits/schema.ts` (all §4 fields, optional), `content/taxonomy/scheme_types.json` (new), `content/taxonomy/source_types.json` (new).

**D2 — Completeness checker + reports**
- Add: `scripts/content-completeness.mjs` (deterministic scorer → `reports/benefit-content-completeness.{json,md}`), `scripts/check-verified-criticals.mjs` (build-fail if a `verified` record misses a critical field).
- Modify: `package.json` (scripts + wire critical-check into `benefits:build`/CI). Tests: `tests/completeness.test.ts`.

**D3 — First expansion set (30–50 high-value benefits)**
- Add: `content/benefits/<slug>.json` for prioritized schemes (student finance TSFS/FASP/NLSFT/ENLS, CSSA already, elderly RCSV/IHCS/EHCCS, disability normal/higher DA already, housing HOS/GSH/WFSM/PRH-elderly, employment ERB/YETP/EPEM, healthcare Samaritan Fund/fee-waiver/screening, family childcare, **tax deductions modelled as `tax_relief`**). All **needs_review** with real official sources; no invented amounts. Archived records for closed one-offs.

**E1 — Research draft structure**
- Add: `research/benefits/<slug>/{research-summary.md,sources.json,extracted-facts.json,proposed-benefit.json,differences.md,unresolved.md}` scaffolding + `docs/RESEARCH_AND_VERIFICATION.md`; `.claude/commands` update. Never auto-overwrite canonical JSON.

**E2 — Link/source validation & stale reporting**
- Add: `scripts/source-audit.mjs` (invalid/non-HTTPS/unexpected-domain/redirect/duplicate/stale-date/hash-change) → `reports/source-change-report.md`; official-domain allowlist `content/taxonomy/official_domains.json`. Network job only.

**E3 — Change-monitor reporting**
- Add: `scripts/change-monitor.mjs` (diff stored `contentHash`/fields → `reports/source-change-report.md`); never auto-edits eligibility.

**Docs (deliverables):** `docs/RULE_ENGINE.md`, `docs/DYNAMIC_QUESTIONNAIRE.md`, `docs/BENEFIT_CONTENT_STANDARD.md`, `docs/RESEARCH_AND_VERIFICATION.md`, `docs/ADDING_A_BENEFIT.md`.

## 7. Testing plan

- **Rule engine:** all/any/none, nested, unknown answers, missing facts, numeric/date limits, income bands, asset limits, conflicting conditions, verified vs stale/needs_review confidence gating.
- **Questionnaire:** no duplicate questions, conditional/skip logic, unknown answers, save/resume, answer revision, minimal-question selection, sensitive-question avoidance, result recalculation.
- **Content:** duplicate id/slug, invalid taxonomy, invalid source domain, malformed URL, verified-missing-critical, invalid/future dates, archived-in-matching, alias collision, missing zh/en name, amount without effective date/source.
- **Regression:** existing 103 tests stay green; existing URLs/profiles/drafts/checklists keep working.
- Network checks (link/source) stay out of `npm test`.

## 8. Rollback plan

- Each sub-batch is an isolated commit; `git revert <sha>` restores prior state.
- C1–C3 are **additive** (new modules, no UI change) → zero runtime impact if reverted.
- C4 keeps `FinderAnswers`/`sessionStorage` and the legacy `matching.ts`; revert restores the hardcoded finder.
- D1 fields are optional; D2/D3 are new content/scripts; reverting drops them without affecting the 21 baseline.
- E1–E3 write only under `research/` and `reports/`; never touch canonical content.
- No Supabase/production mutation at any point.

## 9. Sequencing & scope for this session

Implement in order C1 → C2 → C3 → C4 → D1 → D2 → D3 → E1 → E2 → E3, each its own commit passing `benefits:build`, `typecheck`, `lint`, `test`, `build`. Given size, later sub-batches (esp. D3's 30–50 researched records and E's network tooling) may span multiple sessions; each commit is self-contained and reversible. No completion will be claimed while any gate fails.
