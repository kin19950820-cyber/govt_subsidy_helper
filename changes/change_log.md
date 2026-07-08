# Knowledge Base Change Log

_Maintained by `kb-regression-tester` (Agent 6). Newest entries on top. Run
`/kb-regression` after any knowledge change._

## 2026-07-08 — Stage 1 research complete: all 17 subsidy docs (pipeline run)

### knowledge/ (research pass by kb-knowledge-researcher)
Deep-researched from official `*.gov.hk` sources. Status per doc:

- **verified (6):** `old_age_living_allowance` (OALA $4,345/mo, income/asset
  limits eff 1 Feb 2026), `old_age_allowance` (OAA $1,675/mo, age 70),
  `disability_allowance`, `elderly_health_care_voucher`, `home_care_services`
  (captures 1 Apr 2026 IHCS+EHCCS merge), `guangdong_fujian_scheme`.
- **needs_review (11):** `textbook_assistance`*, `working_family_allowance`*,
  `travel_subsidy`, `internet_subsidy`, `kindergarten_fee_remission`,
  `cssa_student_support`, `public_transport_subsidy` (captures 3 Apr 2026 $2
  rule change + age-60), `integrated_discharge_support`,
  `community_care_service_voucher`, `personal_emergency_link`,
  `elderly_dental_assistance`.  (*still the original seed — not yet deep-researched.)

### Notable real-world changes surfaced (verify in app)
- **$2 transport scheme:** eligible age is **60** (since Feb 2024), and a
  **fare-rule change takes effect 3 Apr 2026** ($2 flat or 80% off). [TD]
- **Home care:** IHCS + EHCCS merged/renamed **1 Apr 2026**. [SWD]
- **OALA/OAA/DA amounts** now sourced with effective dates (were placeholders).

### Impact / next
- Web app (`src/lib/schemes-data.ts`, `supabase/seed.sql`) must be reconciled
  against these docs — see `qa/qa_report.md`.
- Pending (blocked by session limit, resume after reset): kb-terminology-expert
  (glossary refresh), kb-workflow-analyst (workflows refresh),
  kb-knowledge-validator (live link + figure re-verification),
  kb-web-qa-reviewer (full app-vs-KB QA).

## 2026-06-22 — Knowledge base initialised (— → HEAD)

### knowledge/ (new)
- Added the multi-agent knowledge-base scaffold: `_TEMPLATE.md`, `README.md`
  (rules + app↔KB mapping), `glossary.md`, `application_workflows.md`.
- Seeded two subsidy docs: `textbook_assistance.md`,
  `working_family_allowance.md` (`status: needs_review`).

### Impact
- Web app fields to validate later: all schemes in `src/lib/schemes-data.ts`.
- Recommend running: `/kb-pipeline all` (research remaining 15 subsidies) →
  `/kb-validate` → `/kb-qa`.

### Notes
- All figures/windows/quotas in seed docs are `⚠️ Needs Manual Review` — no
  eligibility or amount here is confirmed against official sources yet.
