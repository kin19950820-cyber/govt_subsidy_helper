# 香港政府津貼知識庫 · Government Subsidy Knowledge Base

This directory is the **single source of truth** for every subsidy the web app
presents. The web application (`src/`) must be validated **against these
documents**, not against hardcoded assumptions.

Built and maintained by six reusable Claude Code agents (see
`.claude/agents/kb-*.md`). Run them independently or as a pipeline with
`/kb-pipeline`.

## Golden rules (apply to every agent and every doc)

1. **Official government sources only** — `*.gov.hk` and officially-contracted
   operators linked from a `.gov.hk` page. No blogs, news, forums, NGOs, or AI
   summaries.
2. **Never invent information. Never infer eligibility. Never simplify away a
   legal requirement.**
3. **Always cite the official URL**, and the publication / last-updated date if
   shown.
4. **Read the whole document before writing** — never summarise from a title or
   snippet.
5. Mark anything uncertain as **`⚠️ Needs Manual Review`** with the URL to check.
6. Yearly figures (income limits, amounts, windows, quotas) must be quoted from
   the official current-year page **with source + date**, or marked
   `⚠️ Needs Manual Review`. Never guess a number.

## Files

| File | Produced by | Purpose |
| --- | --- | --- |
| `_TEMPLATE.md` | — | Canonical per-subsidy template (frontmatter + sections). |
| `glossary.md` | kb-terminology-expert | Official terminology, zh/en, misunderstandings. |
| `application_workflows.md` | kb-workflow-analyst | End-to-end journeys + Mermaid. |
| `<subsidy>.md` | kb-knowledge-researcher | One deep-dive doc per subsidy. |
| `../validation/validation_report.md` | kb-knowledge-validator | Sourcing/accuracy audit. |
| `../qa/qa_report.md` | kb-web-qa-reviewer | Web app vs knowledge base. |
| `../changes/change_log.md` | kb-regression-tester | What changed between versions. |

## App ↔ Knowledge mapping

Each `knowledge/<slug>.md` frontmatter carries `webapp_slug`, linking it to a
scheme `slug` in `src/lib/schemes-data.ts` / `supabase/seed.sql`. The Web QA
agent uses this to compare app fields against the knowledge base.

| knowledge slug | webapp_slug | department | primary official host |
| --- | --- | --- | --- |
| `textbook_assistance` | `school-textbook-assistance` | WFSFAA / SFO | wfsfaa.gov.hk |
| `travel_subsidy` | `student-travel-subsidy` | WFSFAA / SFO | wfsfaa.gov.hk |
| `internet_subsidy` | `internet-access-subsidy` | WFSFAA / SFO | wfsfaa.gov.hk |
| `kindergarten_fee_remission` | `kindergarten-fee-remission` | WFSFAA / SFO | wfsfaa.gov.hk |
| `working_family_allowance` | `working-family-allowance` | WFSFAA / WFAO | wfsfaa.gov.hk |
| `cssa_student_support` | `cssa-student-support` | Social Welfare Dept | swd.gov.hk |
| `old_age_living_allowance` | `old-age-living-allowance` | Social Welfare Dept | swd.gov.hk |
| `old_age_allowance` | `old-age-allowance` | Social Welfare Dept | swd.gov.hk |
| `elderly_health_care_voucher` | `elderly-health-care-voucher` | Health Dept | hcv.gov.hk |
| `disability_allowance` | `disability-allowance` | Social Welfare Dept | swd.gov.hk |
| `public_transport_subsidy` | `public-transport-subsidy` | LWB / Transport Dept | gov.hk |
| `integrated_discharge_support` | `integrated-discharge-support-elderly` | SWD / Hospital Authority | swd.gov.hk |
| `personal_emergency_link` | `personal-emergency-link` | SWD (operated by SCHSA) | swd.gov.hk |
| `community_care_service_voucher` | `community-care-service-voucher` | Social Welfare Dept | swd.gov.hk |
| `home_care_services` | `home-care-services` | Social Welfare Dept | swd.gov.hk |
| `guangdong_fujian_scheme` | `guangdong-fujian-scheme` | Social Welfare Dept | swd.gov.hk |
| `elderly_dental_assistance` | `elderly-dental-assistance` | SWD (Community Care Fund) | swd.gov.hk |

> Seed docs in this folder were drafted from established, structurally-stable
> facts and are marked `status: needs_review`. Their **figures, windows and
> quotas are placeholders flagged `⚠️ Needs Manual Review`** until the
> Researcher + Validator confirm them against the official pages. Treat them as
> scaffolding, not verified truth.

## Running the agents

```
/kb-research working family allowance          # Agent 1 (one subsidy)
/kb-validate                                   # Agent 4
/kb-qa                                          # Agent 5
/kb-regression                                  # Agent 6
/kb-pipeline all                                # full pipeline (Agents 1→6)
```

Or invoke a subagent directly, e.g. `@kb-knowledge-researcher research the
Elderly Health Care Voucher Scheme`.
