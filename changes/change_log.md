# Knowledge Base Change Log

_Maintained by `kb-regression-tester` (Agent 6). Newest entries on top. Run
`/kb-regression` after any knowledge change._

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
