# Knowledge Base Validation Report

_Produced by `kb-knowledge-validator` (Agent 4). Run `/kb-validate` to refresh._

**Last run:** 2026-06-22 (initial seed — automated validation not yet executed)
**Overall status:** ⛔ Fix needed — seed docs are `status: needs_review`.

## Summary

| File | Sources | Unsupported | Figure mismatches | Broken links | Needs Manual Review | Status |
| --- | --- | --- | --- | --- | --- | --- |
| glossary.md | seeded | — | n/a | not checked | many | Fix needed |
| application_workflows.md | seeded | — | n/a | not checked | several | Fix needed |
| textbook_assistance.md | 3 | — | not checked | not checked | many | Fix needed |
| working_family_allowance.md | 2 | — | not checked | not checked | many | Fix needed |
| _other subsidies_ | — | — | — | — | — | Not yet researched |

## Findings (initial)

- **High — Coverage gap:** The web app ships 17 schemes (`src/lib/schemes-data.ts`)
  but only 2 have knowledge docs. Run `/kb-pipeline all` to create the rest
  (see mapping in `knowledge/README.md`).
- **High — Unverified figures:** All income limits, allowance amounts,
  application windows and quotas in the seed docs are `⚠️ Needs Manual Review`.
  They must be confirmed against the official pages before `status: verified`.
- **Medium — Link liveness not yet checked:** No `official_urls` have been
  fetched/verified in this initial pass. The next run must confirm each resolves
  (HTTP 200) and still describes the same scheme.

## Action list (for kb-knowledge-researcher, by severity)

1. **High:** Research the remaining 15 subsidies into `knowledge/*.md`.
2. **High:** Replace every `⚠️ Needs Manual Review` figure with the official
   current-year value + source URL + date.
3. **Medium:** Confirm household / income / assets / residency definitions per
   scheme against official wording.
4. **Medium:** Verify all official links resolve; fix any redirects.

> This file is regenerated on each validation run. Do not hand-edit findings —
> fix the knowledge docs and re-run `/kb-validate`.
