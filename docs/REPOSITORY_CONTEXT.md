# Repository Context & Inspection Report

**Repository:** `kin19950820-cyber/govt_subsidy_helper`
**Inspected branch:** `main` (identical to `claude/hk-subsidy-finder-app-9m98ia`)
**Latest commit:** `2e69cca` — "Add scalable Benefits & Public Services architecture (300+ ready)"
**Report generated:** 2026-07-17 · read-only inspection, no code modified.

> ⚠️ This is a factual inspection of what is **actually in the repository**, not
> a description of intent. Where the app displays government information, this
> report flags accuracy/verification status explicitly.

---

## 1. Technology Stack

| Layer | Technology | Version (from `package.json` / lockfile) |
| --- | --- | --- |
| Framework | Next.js (App Router) | `^14.2.35` |
| Language | TypeScript | `^5.5.4` (strict mode on) |
| UI runtime | React / React DOM | `^18.3.1` |
| Styling | Tailwind CSS + PostCSS + Autoprefixer | `^3.4.13` / `^8.4.47` / `^10.4.20` |
| Backend / DB | Supabase (Postgres + Auth + RLS) via `@supabase/supabase-js` `^2.45.4` and `@supabase/ssr` `^0.5.2` | — |
| Lint | ESLint + `eslint-config-next` | `^8.57.0` / `^14.2.35` |
| Node types | `@types/node` `^20`, `@types/react` `^18` | — |
| Build helper | `scripts/build-benefits.mjs` (plain Node, runs on `prebuild`) | — |
| Research module | `research-agent/` — standalone TS crawler using `cheerio` + `pdf-parse` + `tsx` | separate `package.json` |

**Notable absences:** no test framework (no Jest/Vitest/Playwright), no CI config
(`.github/`), no Vercel/Netlify/Docker config, no `public/` directory, no state
library, no form/validation library (e.g. Zod). Deployment target is Vercel per
the README but nothing is committed to configure it.

---

## 2. Repository Tree (important paths)

```
├─ src/
│  ├─ app/                      Next.js App Router pages + API routes
│  │  ├─ page.tsx               Home (hero, group cards, feature cards)
│  │  ├─ finder/page.tsx        Group-aware questionnaire (client)
│  │  ├─ results/page.tsx       Match results (client; reads /api/schemes)
│  │  ├─ benefits/page.tsx      NEW faceted browse by category + life event
│  │  ├─ schemes/page.tsx       All benefits + audience dropdown
│  │  ├─ schemes/[id]/page.tsx  Benefit detail page
│  │  ├─ checklist/page.tsx     Combined document checklist (client)
│  │  ├─ profile/page.tsx       Applicant profile (Supabase Auth or local)
│  │  ├─ drafts/page.tsx        Draft list
│  │  ├─ drafts/[id]/page.tsx   Prefill assistant + JSON export (no auto-submit)
│  │  ├─ admin/schemes/…        Admin CMS (list + editor)
│  │  └─ api/                   schemes (public GET) + admin/schemes CRUD
│  ├─ components/               SiteHeader, SchemeCard, SchemesBrowser, Disclaimer, ProgressSteps, AuthPanel
│  ├─ lib/
│  │  ├─ benefits/              NEW generic model: types.ts, registry.ts, adapter.ts, benefits.generated.json
│  │  ├─ schemes.ts             Data-access; reads content registry (fallback) or Supabase
│  │  ├─ schemes-data.ts        LEGACY 17-scheme hardcoded array (now only a migration source)
│  │  ├─ scheme-mapper.ts       DB row ⇄ SubsidyScheme (admin)
│  │  ├─ matching.ts            Eligibility scoring → 4 confidence levels
│  │  ├─ types.ts               SubsidyScheme, FinderAnswers, taxonomies, labels
│  │  ├─ prefill.ts             Profile → form fields mapping
│  │  ├─ profile-store.ts       Profile persistence (Supabase or localStorage)
│  │  ├─ drafts-store.ts        Draft persistence (Supabase or localStorage)
│  │  ├─ finder-storage.ts      Finder answers in sessionStorage
│  │  ├─ admin-auth.ts          requireAdmin() gate
│  │  └─ supabase/              client.ts, server.ts, admin.ts (service role), config.ts
│  └─ middleware.ts             Supabase session refresh (no-op if unconfigured)
├─ content/                     ★ Scalable, file-driven content store (source of truth for app)
│  ├─ benefits/<slug>.json      21 benefit files
│  └─ taxonomy/{categories,life_events}.json   13 categories, 21 life events
├─ scripts/
│  ├─ build-benefits.mjs        Validate + aggregate content → benefits.generated.json
│  └─ emit-benefits.ts          One-off migration of schemes-data.ts → content/benefits
├─ knowledge/                   17 per-benefit research docs + glossary + workflows + templates
├─ validation/ qa/ changes/     KB agent reports (validation_report, qa_report, change_log)
├─ supabase/
│  ├─ schema.sql                Original 9-table subsidy schema
│  ├─ rls.sql                   RLS policies for the original schema
│  ├─ seed.sql                  Seed for public.subsidy_schemes (17 rows)
│  ├─ benefits_schema.sql       NEW generalized benefits schema (8 tables, no seed)
│  ├─ research_agent_schema.sql research.* schema (research-agent output)
│  └─ seed_subsidy_schemes.sql  research-agent generated seed
├─ research-agent/              Standalone official-source crawler (own package.json)
├─ data/                        research-agent output (raw/extracted git-ignored; processed kept)
├─ .claude/                     6 KB subagents + 6 slash commands
├─ CLAUDE.md  README.md  content/README.md  research-agent/README.md
└─ package.json  tsconfig.json  tailwind.config.ts  next.config.js  .env.local.example
```

---

## 3. Current User Flows

| Flow | Status | Where | Notes |
| --- | --- | --- | --- |
| Browse all benefits | ✅ Implemented | `/schemes` (`SchemesBrowser`) | Reads `getActiveSchemes()` → content registry. |
| Filter by beneficiary group | ✅ Implemented | `/schemes` dropdown (`AudienceGroup`), `/benefits` by category + life event | Two parallel taxonomies: `audience` (5 groups) and `category` (13). |
| Faceted browse (category / life event) | ✅ Implemented | `/benefits/page.tsx` → `queryBenefits()` | Age/means/disability/student/text facets exist in registry; only category + event wired into UI. |
| Questionnaire / subsidy finder | ✅ Implemented | `/finder` → `/results` | Group picker → group-specific questions → `matchSchemes()`. Answers in `sessionStorage`. |
| Benefit detail page | ✅ Implemented | `/schemes/[id]` | Eligibility, documents, steps, official + form links, phone, disclaimer. Works for all 21 via `getBenefitBySlug`. |
| Applicant profile | ✅ Implemented | `/profile` | Supabase Auth (magic link) when configured; otherwise `localStorage` on device. ID stored masked. |
| Eligibility assessment | ⚠️ Partial | `matchSchemes()` in `matching.ts` | Heuristic scoring → 很可能/可能/未必/建議查詢. Group-gated. New benefits have thin rules (see §4). Not a legal determination. |
| Document checklist | ✅ Implemented | `/checklist` | Merges `documents` across selected benefits; print/save. |
| Form prefilling | ✅ Implemented | `/drafts/[id]` | Maps profile → fields, editable review, **JSON export only** (PDF stubbed, disabled). Explicit no-auto-submit WARNING. |
| Admin management | ⚠️ Partial / drifted | `/admin/schemes`, `/api/admin/schemes` | Full CRUD, but targets Postgres `public.subsidy_schemes` — **not** the content store the app now reads, and **not** the new `public.benefits` table. Demo/read-only when Supabase unset. See §5 & §8. |
| Life-event-driven finder | ❌ Not implemented | — | Life events power `/benefits` browse only; the finder does not ask/branch by life event. |
| PDF export of prefilled form | ❌ Not implemented | `/drafts/[id]` | Button present but disabled ("即將推出"). |
| Automated official-link verification | ❌ Not implemented | — | No link checker in code or CI. |
| Notifications / deadlines / renewal reminders | ❌ Not implemented | — | — |

---

## 4. Current Benefit Data (21 records)

All app-displayed benefits live in `content/benefits/<slug>.json` (aggregated to
`src/lib/benefits/benefits.generated.json`). Data is **file-based (committed
JSON)** — not fetched at runtime and (when Supabase is unset) not from the DB.
Every record carries an `officialUrl`, a `formUrl`, a `disclaimer`, and a
`lastUpdated` date. `status` is `verified` or `needs_review`.

| Slug | 中文 / English | Category | status | Knowledge doc? | Structured rules? |
| --- | --- | --- | --- | --- | --- |
| school-textbook-assistance | 學校書簿津貼計劃 / School Textbook Assistance | student_assistance | needs_review | ✅ textbook_assistance.md (needs_review) | matchRule ✅ / rules[] ✗ |
| student-travel-subsidy | 學生車船津貼計劃 / Student Travel Subsidy | student_assistance | needs_review | ✅ travel_subsidy.md (needs_review) | matchRule ✅ / rules[] ✗ |
| internet-access-subsidy | 上網費津貼計劃 / Internet Access Charges | student_assistance | needs_review | ✅ internet_subsidy.md (needs_review) | matchRule ✅ / rules[] ✗ |
| kindergarten-fee-remission | 幼稚園及幼兒中心學費減免 / KCFRS | student_assistance | needs_review | ✅ kindergarten_fee_remission.md (needs_review) | matchRule ✅ / rules[] ✗ |
| cssa-student-support | 綜援學生相關支援 / CSSA (student) | social_security | needs_review | ✅ cssa_student_support.md (needs_review) | matchRule ✅ / rules[] ✗ |
| working-family-allowance | 在職家庭津貼計劃 / Working Family Allowance | employment | needs_review | ✅ working_family_allowance.md (needs_review) | matchRule ✅ / rules[] ✗ |
| old-age-living-allowance | 長者生活津貼 / OALA | social_security | **verified** | ✅ old_age_living_allowance.md (verified) | matchRule ✅ / rules[] ✗ |
| old-age-allowance | 高齡津貼（生果金） / OAA | social_security | **verified** | ✅ old_age_allowance.md (verified) | matchRule ✅ / rules[] ✗ |
| elderly-health-care-voucher | 長者醫療券 / Health Care Voucher | healthcare | **verified** | ✅ elderly_health_care_voucher.md (verified) | matchRule ✅ / rules[] ✗ |
| disability-allowance | 傷殘津貼 / Disability Allowance | disability | **verified** | ✅ disability_allowance.md (verified) | matchRule ✅ / rules[] ✗ |
| public-transport-subsidy | 公共交通費用補貼 / $2 乘車優惠 | elderly | needs_review | ✅ public_transport_subsidy.md (needs_review) | matchRule ✅ / rules[] ✗ |
| integrated-discharge-support-elderly | 離院長者綜合支援計劃 / IDSP | rehab_community | needs_review | ✅ integrated_discharge_support.md (needs_review) | matchRule ✅ / rules[] ✗ |
| personal-emergency-link | 平安鐘 / Personal Emergency Link | elderly | needs_review | ✅ personal_emergency_link.md (needs_review) | matchRule ✅ / rules[] ✗ |
| community-care-service-voucher | 長者社區照顧服務券 / CCSV | rehab_community | needs_review | ✅ community_care_service_voucher.md (needs_review) | matchRule ✅ / rules[] ✗ |
| home-care-services | 家居照顧服務 / Home Care | rehab_community | **verified** | ✅ home_care_services.md (verified) | matchRule ✅ / rules[] ✗ |
| guangdong-fujian-scheme | 廣東 / 福建計劃 / Guangdong-Fujian | social_security | **verified** | ✅ guangdong_fujian_scheme.md (verified) | matchRule ✅ / rules[] ✗ |
| elderly-dental-assistance | 長者牙科服務資助 / Elderly Dental | healthcare | needs_review | ✅ elderly_dental_assistance.md (needs_review) | matchRule ✅ / rules[] ✗ |
| continuing-education-fund | 持續進修基金 / CEF | adult_learning | needs_review | ❌ **none** | matchRule minimal / rules[] 1 (needs_review) |
| public-rental-housing | 公共租住房屋（公屋） / PRH | housing | needs_review | ❌ **none** | matchRule minimal / rules[] 1 |
| erb-training | 僱員再培訓局課程 / ERB Training | employment | needs_review | ❌ **none** | matchRule minimal / rules[] 1 (needs_review) |
| child-development-fund | 兒童發展基金 / CDF | family_child | needs_review | ❌ **none** | matchRule minimal / rules[] 1 (needs_review) |

**Official source URLs** (one primary per record; TC pages verified HTTP 200 on
2026-07-08 except Community Care Fund which is Cloudflare-gated):

- WFSFAA: `…/tc/sfo/primarysecondary/tt/overview.php` (textbook, travel), `…/tt/sia.php` (internet), `…/tc/sfo/preprimary/kcfr/overview.php` (KCFRS), `…/tt/procedures.php` (student form pages), `…/wfao/tc/index.htm` (WFA), `…/cef/tc/index.htm` (CEF)
- SWD: `…/tc/pubsvc/socsecu/comprehens/cssa/` (CSSA), `…/ssallowance/ssaec/ssaec_oala|oaa|nda/index.html` (OALA/OAA/DA), `…/ssa_app/index.html` (SSA form), `…/tc/pubsvc/elderly/cat_commcare/…` (IDSP/CCSV/home care/emergency), `…/gds/index.html` + 2026 application PDF (GD/FJ)
- Dept of Health: `hcv.gov.hk/tc/hcvs/background.html`, `…/target_group.html`
- Transport Dept / PTFSS: `td.gov.hk/tc/gov_public_transport_fare_concession/index.html`, `ptfss.gov.hk/tc-main.html`
- Housing Authority: `housingauthority.gov.hk/tc/public-housing/index.html`, `…/flat-application/index.html`
- ERB (statutory body, **not** `*.gov.hk`): `erb.org/tc/`
- Community Care Fund (**not** `*.gov.hk`): `communitycarefund.hk/`
- CDF: `cdf.gov.hk/tc/`; SCHSA (NGO operator): `schsa.org.hk/tc/` (personal emergency link form)

**Citations / last-verified:** the 17 knowledge docs carry per-fact citations
and `last_verified` frontmatter (6 verified, 11 needs_review). The 4 new
benefits (CEF, PRH, ERB, CDF) have **no knowledge doc and no per-fact citations**
— only `sources[]` pointing at a landing page and a `lastUpdated` of 2026-07-08.

---

## 5. Data Architecture

**Runtime read path (current):** `benefits.generated.json` (built from
`content/benefits/*.json`) → `registry.ts` → `adapter.ts` (`Benefit` →
`SubsidyScheme`) → `schemes.ts` (`getActiveSchemes`/`getSchemeById`) → pages &
`/api/schemes`. When Supabase **is** configured, `schemes.ts` instead reads
`public.subsidy_schemes` and maps via `mapRow`.

**TypeScript types:** two overlapping models —
- `src/lib/types.ts`: `SubsidyScheme`, `EligibilityRule`, `FinderAnswers`,
  `AudienceGroup`, `DocumentKey`, bands/labels (the legacy/UI model).
- `src/lib/benefits/types.ts`: `Benefit`, `BenefitFacets`, `BenefitRule`,
  `Category`, `LifeEvent`, `BenefitQuery` (the new generic model, superset).
The `adapter.ts` bridges Benefit → SubsidyScheme so old UI keeps working.

**Validation schemas:** none at type level (no Zod). Light structural validation
exists only in `scripts/build-benefits.mjs` (slug/file match, known
category/life-event codes). No runtime validation of API inputs.

**Database tables (three distinct schema families, all committed as SQL, none
confirmed applied to a live project):**
- `supabase/schema.sql` + `rls.sql` + `seed.sql`: `profiles`, `household_members`,
  `students`, `subsidy_schemes` (+ `subsidy_eligibility_rules`,
  `subsidy_documents`), `application_drafts`, `application_draft_fields`,
  `admin_users`. **This is what the admin CMS and the Supabase read-path use.**
- `supabase/benefits_schema.sql`: `benefit_categories`, `life_events`, `benefits`,
  `benefit_life_events`, `benefit_documents`, `benefit_forms`, `benefit_sources`,
  `benefit_faq`, `benefit_eligibility_rules`, `benefit_related`. JSONB
  `facets/eligibility/steps/match_rule` + GIN indexes → 300+ without ALTER.
  **No seed; nothing in the app reads this table yet.**
- `research/` schema (`research_agent_schema.sql` + `seed_subsidy_schemes.sql`):
  research-agent output, isolated.

**Knowledge Markdown / JSON:** `knowledge/*.md` (research source of truth, cited)
and `content/benefits/*.json` (machine store). Frontmatter in the knowledge docs
links `webapp_slug` ↔ content slug.

**Duplicate sources of truth — YES, at least four for the same benefits:**
1. `content/benefits/*.json` (21) — what the app renders today.
2. `src/lib/schemes-data.ts` (17) — legacy hardcoded; now only imported by
   `scripts/emit-benefits.ts`.
3. `supabase/seed.sql` → `public.subsidy_schemes` (17) — what admin CMS +
   Supabase read-path use.
4. `supabase/benefits_schema.sql` → `public.benefits` (0 rows) — intended future
   store, currently orphaned.
Plus `knowledge/*.md` (17) as the human source. These are **not kept in sync**:
content has 21, the DB seed has 17 (missing CEF/PRH/ERB/CDF), and enabling
Supabase would silently switch the app to the 17-row `subsidy_schemes` table.

---

## 6. Existing Agent Architecture

**`.claude/agents/` (6 reusable subagents):**
- `kb-knowledge-researcher` — deep-dives one benefit from official `*.gov.hk`
  sources → `knowledge/<slug>.md`; now also aware of the wider platform
  departments and the `content/benefits/<slug>.json` output.
- `kb-terminology-expert` — maintains `knowledge/glossary.md`.
- `kb-workflow-analyst` — maintains `knowledge/application_workflows.md` (Mermaid).
- `kb-knowledge-validator` — audits knowledge for sourcing/figures/links →
  `validation/validation_report.md`.
- `kb-web-qa-reviewer` — compares app vs knowledge vs official → `qa/qa_report.md`.
- `kb-regression-tester` — diffs old vs new knowledge (git) → `changes/change_log.md`.

**`.claude/commands/` (6 slash commands):** `kb-pipeline` (full run), `kb-research`,
`kb-research-category`, `kb-validate`, `kb-qa`, `kb-regression`.

**`scripts/`:** `build-benefits.mjs` (validate + aggregate content), `emit-benefits.ts`
(one-off legacy migration).

**`research-agent/` (separate module):** a polite, robots-aware crawler
(`cheerio` + `pdf-parse`) that downloads official WFSFAA PDFs/pages and emits
structured data + SQL. Run independently via its own `npm` scripts.

**`knowledge/`:** 17 benefit docs (6 verified, 11 needs_review), `glossary.md`,
`application_workflows.md`, `_TEMPLATE.md`, `_BENEFIT_TEMPLATE.md`. Reports live
in `validation/`, `qa/`, `changes/` (currently interim status).

---

## 7. Testing

**None of the following exist:**
- Unit tests — ❌ none (no test runner installed).
- Integration tests — ❌ none.
- Playwright / e2e — ❌ none.
- Content validation — ⚠️ partial: only `scripts/build-benefits.mjs` structural
  checks (slug/file/category/life-event), run at build time; not a test suite.
- Official-link checks — ❌ none automated (URLs were spot-checked manually with
  `curl` during authoring; nothing guards against future link rot).
- Eligibility scenario tests — ❌ none (no fixtures asserting `matchSchemes()`
  output for representative households).

Quality gates that DO run: `npm run typecheck` (tsc) and `npm run lint`
(eslint-config-next). No coverage, no pre-commit hooks in-repo.

---

## 8. Risks and Gaps

### P0 — Critical
- **P0-1 Unverified government information presented to end users.** 15 of 21
  benefits are `status: needs_review`; the 4 newest (CEF, PRH, ERB, CDF) have
  **no knowledge doc and no per-fact citations**, and time-sensitive figures are
  embedded in eligibility text (e.g. `$2` scheme age 60 and the 3 Apr 2026 fare
  rule, OALA income/asset limits, KCFRS 2026/27 date). If any is stale/wrong, a
  low-income or elderly user could act on incorrect eligibility. A disclaimer is
  shown, but the content still reads as authoritative. **Mitigation owed before
  any public launch.**
- **P0-2 No automated official-link verification.** Several `officialUrl`s point
  at deep sub-pages (`hcv.gov.hk/.../background.html`, `.../target_group.html`,
  a dated GD/FJ application PDF). Government reorganises URLs frequently; a dead
  "官方連結"/"申請表" link on a benefits site is a critical trust failure and
  nothing detects it.

### P1 — High
- **P1-1 Multiple divergent sources of truth.** `content/benefits` (21) vs
  `public.subsidy_schemes` seed (17) vs `public.benefits` (0) vs
  `schemes-data.ts` (17). **Enabling Supabase would regress the live app to the
  17-row `subsidy_schemes` table**, dropping CEF/PRH/ERB/CDF and any content
  edits. High risk of silent data divergence.
- **P1-2 Admin CMS edits the wrong store.** `/admin/schemes` writes
  `public.subsidy_schemes`, which the content-driven app does not read (when
  Supabase is unset) and which is a different shape from `public.benefits`.
  Admin changes will not appear; "last verified date" set in admin is invisible
  to users.
- **P1-3 No test safety net.** Zero tests means eligibility logic, link
  integrity, content schema, and RLS can regress undetected. Eligibility is the
  product's core claim and is entirely unguarded.
- **P1-4 Non-`*.gov.hk` official sources used without flagging.** ERB
  (`erb.org`) and Community Care Fund (`communitycarefund.hk`) are surfaced as
  the official source; the project's own rule is "official government sources
  only." These are legitimate statutory/official bodies but should be explicitly
  labelled, and the dental/CCF page is Cloudflare-gated (unverifiable link).

### P2 — Medium
- **P2-1 New benefits are weakly structured for matching.** CEF/PRH/ERB/CDF have
  minimal `matchRule` and 1 unverified `rules[]` entry, so the finder scores them
  poorly and may mis-rank them relative to the well-modelled 17.
- **P2-2 `/api/admin/schemes` GET is unauthenticated.** It returns *all* schemes
  incl. inactive to any caller (with `demo/ok` flags). Low data sensitivity
  (scheme data is public), but inactive/unpublished rows leak.
- **P2-3 Two parallel taxonomies** (`audience` 5 groups vs `category` 13) with
  overlapping meaning; finder uses `audience`, browse uses `category`. Risk of
  inconsistent categorisation as the catalogue grows.
- **P2-4 `benefits_schema.sql` has no seed and no generator.** The 300+ DB story
  is unproven end-to-end; there is no `content → public.benefits` SQL emitter.

### P3 — Low
- **P3-1 Mobile accessibility not audited.** UI is mobile-first by design (large
  tap targets, big text) but there is no automated a11y check, no `lang`/ARIA
  audit, and no contrast verification.
- **P3-2 No `public/` assets** (favicon, og image, manifest) — minor polish/SEO.
- **P3-3 Personal data**: handled reasonably — ID stored masked (last 4),
  bank/income optional, `localStorage` fallback clearly labelled "device only",
  and DB rows protected by own-row RLS. Residual: masking happens client-side and
  full ID could be typed; no server-side enforcement of the mask.

**On exposed personal information / weak RLS specifically:** RLS in `rls.sql` is
sound for `profiles`, `students`, `household_members`, `application_drafts`
(strict `auth.uid()` ownership) and public-read/admin-write for schemes.
`benefits_schema.sql` mirrors this. No cross-user exposure was found in the SQL.
The main caveat is that none of this is verified against a live project, and the
admin write-path uses the **service-role key** (bypasses RLS) gated only by
`requireAdmin()` — correct, but a single point of failure if that check regresses.

---

## 9. Recommended Next Changes (three batches)

### Batch 1 — Collapse to a single source of truth
**Objective:** eliminate data divergence so the app, admin, and DB agree, and so
enabling Supabase never regresses the catalogue.
- **Create:** `scripts/emit-benefits-sql.mjs` (content → `supabase/benefits_seed.sql`
  for `public.benefits` + child tables); `src/lib/benefits/db.ts` (read `benefits`
  table when Supabase configured, mapping to `Benefit`).
- **Modify:** `src/lib/schemes.ts` (route BOTH the Supabase and file paths through
  the Benefit registry/`public.benefits`, not `subsidy_schemes`);
  `src/app/admin/**` + `src/lib/scheme-mapper.ts` (point CRUD at `benefits`);
  retire `src/lib/schemes-data.ts` (keep only if still needed by emit).
- **Migrations:** apply `supabase/benefits_schema.sql`; add `supabase/benefits_seed.sql`;
  deprecate `subsidy_schemes` read-path (keep table for back-compat, stop reading).
- **Tests:** content↔DB parity test (counts + slugs match); adapter round-trip test.
- **Acceptance:** with Supabase ON or OFF the app shows the same 21 benefits;
  an admin edit is reflected on the public detail page; no reference to
  `subsidy_schemes` in the read path.

### Batch 2 — Verification & trust (accuracy is the product)
**Objective:** guarantee every displayed fact is sourced and every link resolves.
- **Create:** `scripts/check-links.mjs` (HTTP-check every `officialUrl`/`formUrl`/
  `sources[]`, fail on non-2xx/3xx); `knowledge/{continuing_education_fund,
  public_rental_housing,erb_training,child_development_fund}.md` (research the 4
  uncited benefits); `.github/workflows/ci.yml` (typecheck, lint, benefits:build,
  check-links, tests).
- **Modify:** the 4 new `content/benefits/*.json` (add citations, tighten
  eligibility, keep `needs_review` until validated); `validation/validation_report.md`
  + `qa/qa_report.md` (run `kb-knowledge-validator` + `kb-web-qa-reviewer` to
  promote verified docs); add a visible per-benefit "最後核實日期 / 待核實" badge
  in `src/app/schemes/[id]/page.tsx`.
- **Migrations:** none.
- **Tests:** link-check job in CI; a content-lint test asserting every benefit has
  ≥1 source and a `lastUpdated` within N months, and that `needs_review` benefits
  render the "待核實" badge.
- **Acceptance:** CI red on any dead official/form link or uncited benefit; all
  4 new benefits have knowledge docs; detail pages display verification status.

### Batch 3 — Structured eligibility + finder correctness
**Objective:** make matching trustworthy and testable across the full catalogue.
- **Create:** `src/lib/benefits/eligibility.ts` (evaluate `benefit_eligibility_rules`
  generically, replacing/augmenting the `SubsidyScheme.rule` heuristic);
  `tests/eligibility.spec.ts` fixtures for representative households (low-income
  student family, 70+ elderly, PWD, discharged patient, PRH applicant).
- **Modify:** `src/lib/matching.ts` (consume structured rules + facets, keep the
  4-level output); each `content/benefits/*.json` (populate `rules[]` from the
  verified knowledge docs); `src/app/finder/page.tsx` (optionally add a life-event
  entry point feeding `queryBenefits`).
- **Migrations:** none (rules already in `benefit_eligibility_rules`).
- **Tests:** eligibility scenario suite (assert expected match level per fixture);
  snapshot of `/results` for a fixed answer set.
- **Acceptance:** every benefit has ≥1 structured rule; scenario tests pass; the
  finder ranks the 4 new benefits sensibly; no benefit relies solely on the old
  `matchRule` heuristic.

---

## 10. Questions Requiring Human Decision

1. **Launch gating on verification.** Is public exposure acceptable while 15/21
   benefits are `needs_review` and 4 are uncited, relying on the disclaimer — or
   should only `verified` benefits be publicly visible until validated?
2. **Authoritative store.** Confirm `public.benefits` (new schema) as the single
   runtime store and formally deprecate `subsidy_schemes`, or keep the legacy
   table as the admin store? This determines Batch 1's direction.
3. **Non-`gov.hk` sources.** Are statutory-body/официальный sites (ERB `erb.org`,
   Community Care Fund `communitycarefund.hk`, SCHSA for 平安鐘) acceptable as
   "official," and how should they be labelled to users?
4. **Compliance/liability wording.** Does the current disclaimer + "系統只幫你整理
   資料，不代表政府已批准" meet the legal bar for presenting eligibility estimates,
   or is sign-off from a HK welfare/legal reviewer required before launch?
5. **Personal data policy.** Should full HKID entry be blocked at the input layer
   (server-enforced masking) and a data-retention/DPO position be defined before
   collecting profiles at scale?

---

## Summary

1. **Current branch / latest commit:** `main` (= `claude/hk-subsidy-finder-app-9m98ia`) · `2e69cca`.
2. **Total benefit records:** **21** (in `content/benefits/`; note the DB seed and legacy array still hold only 17).
3. **Total official source links:** **21** primary `officialUrl` (one per benefit; knowledge docs cite many more).
4. **Total form links:** **21** `formUrl` (one per benefit).
5. **Total tests:** **0** (only `typecheck`, `lint`, and a build-time content validator run).
6. **Five highest-risk findings:**
   - **P0-1** Unverified/uncited government info shown as authoritative (15/21 `needs_review`; 4 benefits with no knowledge doc).
   - **P0-2** No automated official-link verification (deep sub-page + dated-PDF links will rot silently).
   - **P1-1** Four divergent sources of truth; enabling Supabase would regress the app to 17 old schemes.
   - **P1-2** Admin CMS writes `subsidy_schemes`, which the live app does not read — admin edits & verification dates are invisible.
   - **P1-3** Zero automated tests guarding eligibility logic, content, links, and RLS.
```
