# Web App QA Report (App vs Knowledge Base)

_Produced by `kb-web-qa-reviewer` (Agent 5). Run `/kb-qa` to refresh._

**Last run:** 2026-06-22 (initial seed — automated QA not yet executed)
**Rule:** the knowledge base is the single source of truth; the app is checked
against it.

## Summary

| Scheme (webapp_slug) | Has KB doc? | App-vs-KB status | Findings |
| --- | --- | --- | --- |
| school-textbook-assistance | ✅ (needs_review) | Not yet compared | — |
| working-family-allowance | ✅ (needs_review) | Not yet compared | — |
| student-travel-subsidy | ❌ | KB missing | Create KB doc first |
| internet-access-subsidy | ❌ | KB missing | Create KB doc first |
| kindergarten-fee-remission | ❌ | KB missing | Create KB doc first |
| cssa-student-support | ❌ | KB missing | Create KB doc first |
| old-age-living-allowance | ❌ | KB missing | Create KB doc first |
| old-age-allowance | ❌ | KB missing | Create KB doc first |
| elderly-health-care-voucher | ❌ | KB missing | Create KB doc first |
| disability-allowance | ❌ | KB missing | Create KB doc first |
| public-transport-subsidy | ❌ | KB missing | Create KB doc first |
| integrated-discharge-support-elderly | ❌ | KB missing | Create KB doc first |
| personal-emergency-link | ❌ | KB missing | Create KB doc first |
| community-care-service-voucher | ❌ | KB missing | Create KB doc first |
| home-care-services | ❌ | KB missing | Create KB doc first |
| guangdong-fujian-scheme | ❌ | KB missing | Create KB doc first |
| elderly-dental-assistance | ❌ | KB missing | Create KB doc first |

## Findings (by category)

_Populated on the next `/kb-qa` run once the KB is validated. Each finding will
list: Severity · app `file:line`/field · app value · KB/official value · fix._

- **Incorrect information:** —
- **Missing information:** —
- **Outdated information:** —
- **Broken links:** —
- **Misleading wording:** —

## Known context for the QA agent

- App scheme content: `src/lib/schemes-data.ts` and `supabase/seed.sql` (must
  agree with each other and the KB).
- Elderly/disability schemes in the app were seeded from established programmes
  but their figures are unverified — expect Medium/High findings until the KB
  docs are researched and validated.

> Regenerated on each QA run. Fix the app (or the KB) then re-run `/kb-qa`.
