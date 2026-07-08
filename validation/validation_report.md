# Knowledge Base Validation Report

_Produced by `kb-knowledge-validator` (Agent 4). Run `/kb-validate` to refresh._

**Last update:** 2026-07-08 — **interim** (Stage-1 research complete; the full
automated validator run, which live-checks every link and figure, is pending the
session-limit reset at 05:40 UTC).
**Overall status:** 6 docs `verified`, 11 `needs_review`, 0 not-yet-researched.

## Status summary (17 subsidies)

| Doc | Status | Key figures sourced with effective date? |
| --- | --- | --- |
| old_age_living_allowance | ✅ verified | Yes — $4,345/mo; limits eff 1 Feb 2026 |
| old_age_allowance | ✅ verified | Yes — $1,675/mo; age 70; residence rule |
| disability_allowance | ✅ verified | Yes — Normal/Higher DA |
| elderly_health_care_voucher | ✅ verified | Yes |
| home_care_services | ✅ verified | Yes — April-2026 service briefs |
| guangdong_fujian_scheme | ✅ verified | Yes — cross-checked vs OAA/OALA |
| public_transport_subsidy | ⚠️ needs_review | Mostly — see items below |
| cssa_student_support | ⚠️ needs_review | Partial — current-year rates to confirm |
| travel_subsidy | ⚠️ needs_review | AFI bands yes; STS has no fixed rate |
| internet_subsidy | ⚠️ needs_review | To confirm |
| kindergarten_fee_remission | ⚠️ needs_review | To confirm |
| integrated_discharge_support | ⚠️ needs_review | Referral service; scope to confirm |
| community_care_service_voucher | ⚠️ needs_review | Co-payment tiers to confirm |
| personal_emergency_link | ⚠️ needs_review | Operator/subsidy detail to confirm |
| elderly_dental_assistance | ⚠️ needs_review | CCF page gated; press-release sourced |
| textbook_assistance | ⚠️ needs_review | **Seed — not yet deep-researched** |
| working_family_allowance | ⚠️ needs_review | **Seed — not yet deep-researched** |

## Open `⚠️ Needs Manual Review` items (surfaced by researchers)

- **cssa_student_support:** current-year (2025/26–2026/27) dollar figures quoted
  from the Oct-2023 CSSA Guide; confirm latest rates; confirm exact SFO schemes
  superseded; confirm home-internet grant item.
- **travel_subsidy:** confirm no asset test; official document checklist from the
  current-year "Notes"; appeal mechanism; STS has **no fixed dollar rate**
  (district-based) — do not present an entitlement amount.
- **public_transport_subsidy:** full "eligible PwD" definition; HK-resident
  definition for $2 scheme; JoyYou Card requirements; PTFSS registrable ticket
  types; current covered-route counts.
- **home_care_services:** fee-tier income/asset thresholds; household definition
  for fees; current HSS age rule (60 vs 65); CSSA fee waiver.
- **elderly_dental_assistance / personal_emergency_link:** primary SWD/CCF pages
  were 404/Cloudflare-gated; re-fetch the canonical pages to confirm.

## Action list

1. **High:** Deep-research the two remaining **seed** docs (`textbook_assistance`,
   `working_family_allowance`) to replace placeholder figures.
2. **High (validator, needs network):** Live-check every `official_urls` and
   source reference (HTTP 200 + same scheme); confirm each `needs_review` figure
   against its official page; then promote to `verified`.
3. **Medium:** Re-fetch the gated dental / emergency-link pages.

> Interim report — the automated `kb-knowledge-validator` run (live link/figure
> verification) is queued for after the session-limit reset.
