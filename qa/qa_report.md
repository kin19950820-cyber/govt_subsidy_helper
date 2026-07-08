# Web App QA Report (App vs Knowledge Base)

_Produced by `kb-web-qa-reviewer` (Agent 5). Run `/kb-qa` to refresh._

**Last update:** 2026-07-08 — **interim**. All 17 subsidies now have KB docs, so
the app can finally be validated against the KB. The **full automated QA run
(field-by-field + live link checks) is pending the session-limit reset** at
05:40 UTC. Below are candidate reconciliation targets already evident from the
research — to be confirmed/expanded by the agent run, not yet verified findings.

## Candidate discrepancies to reconcile (app → KB)

App scheme content lives in `src/lib/schemes-data.ts` and `supabase/seed.sql`
and was seeded with **placeholder** figures/links for the non-student schemes.
Now that the KB is researched, priority reconciliation targets:

| App scheme | Candidate issue vs KB | Severity (prelim) |
| --- | --- | --- |
| public-transport-subsidy | KB: eligible age **60** and a **3 Apr 2026** fare-rule change ($2 flat / 80% off) + JoyYou Card requirement — app copy is generic and omits both. | High |
| old-age-living-allowance | KB canonical page is `swd.gov.hk/oala/index_e.html`; app `officialUrl` uses the generic `sub_ssallowance/` path. Confirm phone/department. | Medium |
| old-age-allowance | KB: OAA amount **$1,675** eff 1 Feb 2026, non-means-tested at 70; app shows no amount (OK) but confirm eligibility wording + link. | Medium |
| guangdong-fujian-scheme | KB canonical pages `swd.gov.hk/gds` + `/fjs`; app link generic. In-province 60-day rule not surfaced in app copy. | Medium |
| home-care-services | KB: 1 Apr 2026 merge/rename ("Home Care Services for Frail Elderly Persons"); app name/eligibility predate this. | Medium |
| disability-allowance | KB has Normal/Higher DA + medical criterion; confirm app eligibility text matches. | Medium |
| elderly-health-care-voucher | Confirm app voucher description vs KB (amount/cap). | Low |
| student schemes (textbook/travel/internet/kindergarten) | Confirm eligibility text, documents, official/form URLs and phone (2802 2345) against KB. | Medium |

## Not yet done (queued for the agent run)

- Live-fetch every app `officialUrl` / `formUrl` and flag non-200 / redirects.
- Field-by-field diff of every eligibility line, document checklist, step,
  warning, FAQ, phone, department against the mapped `knowledge/*.md`.
- Group findings as Incorrect / Missing / Outdated / Broken links / Misleading
  with Critical / High / Medium / Low severity.

> Interim — do not treat the table above as confirmed defects; it is the
> reconciliation backlog the `kb-web-qa-reviewer` run will verify and detail.
