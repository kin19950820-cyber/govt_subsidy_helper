# Architecture Review — Phase 1 Audit

**Repository:** `govt_subsidy_helper` · **Branch:** `main` @ `beffe74`
**Author:** Lead Architect review · **Date:** 2026-07-17
**Companion doc:** `docs/REPOSITORY_CONTEXT.md` (raw inventory — tech stack, file
tree, the 21 benefit records, flow list). This document is the **architectural
assessment**: how the system is put together, where it will break, and what to
fix first. No code was changed.

---

## 1. Current Architecture

Next.js 14 App Router monolith, TypeScript strict, Tailwind, optional Supabase.
Three conceptual layers, but with **two overlapping domain models** bridged by an
adapter:

```
                       ┌─────────────────────────────────────────────┐
   CONTENT (source)    │  content/benefits/*.json  (21)              │
                       │  content/taxonomy/{categories,life_events}   │
                       └───────────────┬─────────────────────────────┘
                                       │ scripts/build-benefits.mjs (prebuild)
                                       ▼
                       src/lib/benefits/benefits.generated.json  (bundled)
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼ registry.ts (Benefit model)  │                              ▼
   /benefits page  ── queryBenefits()   │                     adapter.ts
   (Server, faceted)                    │              Benefit → SubsidyScheme
                                        ▼                              │
                          src/lib/schemes.ts  ◄───────────────────────┘
              getActiveSchemes / getSchemeById / getAllSchemes
                    │                         │
        (no Supabase)│              (Supabase set)│  reads public.subsidy_schemes
        content ─────┘                          └── (DIFFERENT store, 17 rows)
                    │
        ┌───────────┼───────────────────────────────────────────────┐
        ▼           ▼                    ▼                            ▼
  /schemes (SC)  /schemes/[id] (SC)   /api/schemes (route) ── fetched by ──►
                                                          results, checklist,
                                                          drafts (Client Components)
```

**Legend:** SC = Server Component. The legacy `SubsidyScheme` type (`lib/types.ts`)
is still the lingua franca of the whole UI; the new `Benefit` model
(`lib/benefits/types.ts`) is only consumed directly by `/benefits`. Everything
else flows through `adapter.benefitToScheme()`.

**Persistence & auth:** Supabase Auth (magic-link) + Postgres + RLS, all
*optional* — the app runs fully on committed JSON with `localStorage` fallbacks
for profile/drafts. Admin writes use the **service-role key** (bypasses RLS)
gated by `requireAdmin()`.

**Agent/knowledge subsystem:** `knowledge/*.md` (research source of truth, cited),
`.claude/agents` (6 subagents) + commands, `research-agent/` (standalone crawler).
This is well-separated and is the strongest part of the architecture.

---

## 2. Data Flow (request lifecycle)

**Read (public):**
- `/schemes`, `/schemes/[id]`, `/benefits` — **Server Components** that call the
  data layer directly at request time. All three are marked
  `export const dynamic = "force-dynamic"`.
- `/results`, `/checklist`, `/drafts`, `/drafts/[id]` — **Client Components** that
  `fetch("/api/schemes")` at runtime, which server-side calls `getActiveSchemes()`.
- `/finder` — Client Component; answers persisted to `sessionStorage`
  (`finder-storage.ts`), read by `/results` which runs `matchSchemes()` **on the
  client**.

**Write (admin):** `/admin/schemes` (Client) → `/api/admin/schemes[/id]` (Route
Handlers) → `requireAdmin()` → service-role client → `public.subsidy_schemes`.

**Build:** `prebuild` runs `build-benefits.mjs` (validates + aggregates content →
`benefits.generated.json`). `tsc` + `eslint` are the only gates.

**Key observation:** the same static benefit data is delivered by **two different
mechanisms** — embedded at build (Server Components import the generated JSON via
the registry) *and* re-fetched over HTTP at runtime (`/api/schemes` for the
client pages). This is the root of several problems below.

---

## 3. Problems (prioritised)

Severity: **P0** blocks a trustworthy launch · **P1** high · **P2** medium · **P3** low.

### P0 — Correctness / trust
- **P0-1 `force-dynamic` on fully static content.** `/schemes` and
  `/schemes/[id]` re-render on every request for data that is committed JSON.
  This forfeits SSG/ISR, adds latency, and — combined with P1-1 — means a future
  Supabase toggle silently changes what users see. Static content must render
  statically (SSG + `generateStaticParams`, or ISR with revalidate).
- **P0-2 Client-side eligibility matching.** `matchSchemes()` runs in the browser
  on `/results`. Eligibility is the product's core claim; running it client-side
  makes it untestable in isolation, un-auditable, and shippable-with-bugs to every
  device. It belongs behind a typed, server-testable rule engine.

### P1 — Structural / data integrity
- **P1-1 Divergent sources of truth (4).** `content/benefits` (21) ≠
  `subsidy_schemes` seed (17) ≠ `public.benefits` (0, orphaned) ≠
  `schemes-data.ts` (17 legacy). Enabling Supabase regresses the catalogue. (Full
  analysis in REPOSITORY_CONTEXT.md §5.)
- **P1-2 Two domain models + adapter tax.** `SubsidyScheme` and `Benefit` coexist;
  every read goes Benefit → adapter → SubsidyScheme. New Benefit fields
  (`facets`, `rules[]`, `lifeEvents`, `meansTest`, …) are **dropped** by the
  adapter, so the richer model is invisible to all pages except `/benefits`.
- **P1-3 Matching ignores structured rules.** The engine reads the legacy
  `EligibilityRule` object (hand-written `if/else` scoring in `matching.ts`), not
  the `BenefitRule[]` / `benefit_eligibility_rules`. The 4 new benefits (thin
  `matchRule`) are effectively unmatched. There is no real rule engine yet.
- **P1-4 No validation at the boundaries.** No Zod (confirmed). Admin
  `POST/PUT` bodies are only field-whitelisted by `schemeToRow`; content JSON is
  only shape-checked by `build-benefits.mjs`. A malformed benefit file or API
  payload can enter silently.

### P2 — Duplication / consistency
- **P2-1 Three row/object mappers** doing the same job: `mapRow` (schemes.ts),
  `rowToScheme`/`schemeToRow` (scheme-mapper.ts), `benefitToScheme` (adapter.ts).
- **P2-2 Two parallel taxonomies** — `AudienceGroup` (5, used by finder/matching)
  vs `Category` (13, used by browse). Overlapping semantics, manual mapping in
  `emit-benefits.ts`, drift risk as the catalogue grows.
- **P2-3 Two document models** — `DocumentKey` enum (`types.ts`) vs
  `BenefitDocument` (`benefits/types.ts`); checklist merges by `key`.
- **P2-4 Data delivered twice** — bundled *and* via `/api/schemes` (see §2).

### P3 — Polish
- **P3-1** No `public/` (favicon/og/manifest). **P3-2** Legacy `schemes-data.ts`
  still present as a shadow catalogue. **P3-3** `/api/admin/schemes` GET is
  unauthenticated and returns inactive rows.

---

## 4. Technical Debt Register

| # | Debt | Location | Interest (cost of leaving it) |
| --- | --- | --- | --- |
| D1 | Legacy `SubsidyScheme` as universal type | `lib/types.ts`, all pages | Every new Benefit capability needs adapter plumbing; blocks facets/rules in UI |
| D2 | `schemes-data.ts` shadow catalogue | `lib/schemes-data.ts` | Third copy of 17 benefits; confuses "source of truth" |
| D3 | Hand-coded matching heuristic | `lib/matching.ts` | Not extensible to AND/OR/NOT; untested; ignores structured rules |
| D4 | Admin CMS points at wrong table | `admin/**`, `scheme-mapper.ts` | Admin edits invisible to users |
| D5 | Orphaned `public.benefits` schema | `supabase/benefits_schema.sql` | 300+ story unproven; no seed emitter |
| D6 | No Zod / runtime validation | app-wide | Silent bad data; no typed content contract |
| D7 | Client fetch of static data | `results/checklist/drafts` | Extra RTT, no SSG, harder testing |

---

## 5. Duplicate Logic (explicit)

- **Catalogue data:** `content/benefits` + `schemes-data.ts` + `subsidy_schemes` seed + `public.benefits`.
- **Mappers:** `mapRow` + `rowToScheme` + `benefitToScheme` (+ `schemeToRow` inverse).
- **Taxonomy:** `AudienceGroup`/`AUDIENCE_LABELS` vs `categories.json`; `GradeLevel`/`AgeBand`/`AssetBand`/`IncomeBand` bands duplicated between finder types and facets.
- **Disclaimer text** hard-coded in `Disclaimer.tsx`, `drafts/[id]` WARNING, and every benefit's `disclaimer` field.
- **Persistence pattern** duplicated across `profile-store.ts` and `drafts-store.ts` (Supabase-or-localStorage branching copy-pasted).

---

## 6. Missing Tests

Zero automated tests (no runner installed). Highest-value gaps, in order:
1. **Rule-engine / matching** unit tests (fixtures per household archetype).
2. **Content schema validation** (Zod) as a test, beyond the build script.
3. **Official-link + form-link** reachability checks (CI job).
4. **Adapter/registry** round-trip and parity (content ↔ DB counts/slugs).
5. **Questionnaire** flow + **e2e** (Playwright) for finder→results→checklist.
6. **RLS** policy tests (own-row isolation) once a Supabase test project exists.

---

## 7. Scalability Issues

- **Content scales; the read path does not.** The generated JSON is imported
  wholesale into both server and client bundles. At 300+ benefits with full
  `eligibility`/`steps`/`faq`, `benefits.generated.json` becomes a large bundled
  asset shipped to clients via `/api/schemes`. Needs: per-benefit static routes
  (SSG), list endpoints that return summaries only, and detail fetched by slug.
- **`force-dynamic` everywhere** means no CDN caching of catalogue pages — server
  cost grows linearly with traffic for static data.
- **Matching is O(n) client-side** over the full catalogue per finder run; fine at
  21, wasteful at 300+, and unshardable by category/life-event.
- **Taxonomy duplication** (audience vs category) will require double-tagging every
  new benefit — a manual, error-prone scaling tax.
- **DB story unfinished:** no `content → public.benefits` emitter, so the
  "300+ without schema change" claim is not exercised end-to-end.

---

## 8. Security Concerns

- **Service-role key is the single gate.** Admin writes use
  `createAdminClient()` (bypasses RLS) behind `requireAdmin()`. Correct today, but
  one regression in that check = full write access. Prefer RLS-enforced writes with
  the *user* session, reserving service-role for server-only jobs.
- **`/api/admin/schemes` GET unauthenticated** — returns all rows incl. inactive.
  Low sensitivity (public scheme data) but leaks unpublished content.
- **No input validation** on admin mutations beyond field-whitelisting; add Zod.
- **RLS (SQL) is sound but unverified against a live project** — own-row policies
  for `profiles/students/household_members/application_drafts`, public-read/
  admin-write for schemes/benefits. No cross-user exposure found in SQL.
- **PII:** HKID stored masked (last 4) client-side; masking is not server-enforced,
  and bank/income are optional free-text. Acceptable for a prototype; needs a
  retention/DPO policy before real collection.
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY` server-only; `NEXT_PUBLIC_*` are public
  by design; `config.isSupabaseConfigured` guards accidental client use. OK.

---

## 9. Performance Issues

- **Missed SSG/ISR** on `/schemes`, `/schemes/[id]`, `/benefits` (all
  `force-dynamic`) despite static content — every hit is SSR.
- **Redundant runtime fetch** of static catalogue via `/api/schemes` on 4 client
  pages (extra round-trip + JSON re-serialisation).
- **Whole-catalogue in client bundle** path for matching/results.
- **No image pipeline** (no images yet; will matter for department logos/OG).
- **No caching headers / `revalidate`** anywhere.
- Positives: minimal deps (no heavy client libs), first-load JS ~87 kB shared,
  strict TS, prebuild JSON generation keeps content out of the request path
  *for server components*.

---

## 10. Accessibility Issues

- **Good baseline:** `<html lang="zh-Hant-HK">`, mobile-first, large tap targets
  (`.btn` min-height 56px), 17px base font, semantic headings, labelled inputs.
- **Gaps to WCAG AA:** color-contrast unverified (brand teal on white, amber
  chips); no skip-to-content link; dynamic `/results` and `/finder` updates lack
  `aria-live`; several inputs rely on placeholder as label; no visible focus-ring
  audit; no "elder mode"/text-scaling/high-contrast toggle (explicitly requested
  in the goal); toggle buttons (係/唔係) are `<button>` without `aria-pressed`;
  the print-checklist flow has no print stylesheet.
- **No automated a11y checks** (axe/Playwright) to prevent regressions.

---

## 11. Developer Experience Improvements

- Add **Vitest + Playwright**, a **CI workflow** (typecheck, lint, build,
  content-validate, link-check, tests), and **Prettier**.
- Introduce **Zod schemas** as the single content contract (used by
  `build-benefits.mjs`, the API, and types via `z.infer`) — kills D6 and unifies
  validation.
- **Collapse the two domain models**: make `Benefit` canonical, generate the
  `SubsidyScheme` view only where legacy UI needs it, and delete `schemes-data.ts`.
- **One data-access module** with pluggable source (content JSON vs
  `public.benefits`) so Supabase never diverges.
- Document generators (Phase 13) so the model stays discoverable.

---

## 12. How the requested Phases map onto these findings

| Phase | Addresses | Prereq |
| --- | --- | --- |
| 2 Content architecture (modular taxonomy: departments, beneficiary_groups, document_types, glossary/faq/forms folders) | P2-2, P2-3, D6 | none — safe, additive |
| 3 Knowledge base (per-benefit md folders) | trust, P0 verification | none — additive |
| 4 Research agents (6) | P0-1/P0-2 verification, link-check | extends existing `.claude/agents` |
| 5 Rule engine (AND/OR/NOT, confidence, reasons) | P0-2, P1-3, D3 | Zod + tests |
| 6 Life-event navigation | P2-2 | taxonomy from Phase 2 |
| 7 Dynamic questionnaire from rules | P1-3, D3 | Phase 5 engine |
| 8 CMS on the right store | D4, P1-1 | Phase 1 data unification |
| 9 Search (zh/en/Cantonese/nicknames) | discoverability | content index |
| 10 Accessibility (WCAG AA, elder mode) | §10 | none — incremental |
| 11 Testing (Vitest/Playwright/link) | §6 | CI |
| 12 Performance (SSG/ISR/caching) | P0-1, §9 | data unification |
| 13 Docs | DX | after each batch |

**Recommended first three implementation batches** (each will get its own
before/after explanation per the workflow rules; no code until approved):

- **Batch A — Foundations & safety net (enables everything):** Zod content
  schemas + `content/taxonomy` expansion (`departments.json`,
  `beneficiary_groups.json`, `document_types.json`) [Phase 2]; Vitest + a
  content-validation + link-check test; CI workflow [Phase 11]. *No behaviour
  change, fully backward compatible.*
- **Batch B — Single source of truth + SSG:** unify the data-access layer on the
  `Benefit` model, retire `schemes-data.ts`, point admin/CMS + Supabase read at
  one store, and convert `/schemes` + `/schemes/[id]` to SSG/ISR with
  `generateStaticParams` [Phases 8/12, P1-1/P1-2/P0-1].
- **Batch C — Rule engine + dynamic questionnaire:** typed AND/OR/NOT rule engine
  with confidence + reasons + missing-info, server-side; migrate `matchSchemes`
  to it; drive finder questions from rules [Phases 5/7, P0-2/P1-3].

---

## 13. Open Decisions Before Phase 2 (need human input)

1. **Canonical store:** confirm `Benefit` (content + `public.benefits`) as the one
   source of truth and formal deprecation of `subsidy_schemes` + `schemes-data.ts`.
2. **Launch gating:** hide `needs_review` benefits from the public until verified,
   or show with a badge? (15/21 are unverified; 4 uncited.)
3. **Rendering:** SSG+ISR (with a revalidate window) vs keep dynamic — acceptable
   staleness window for government data?
4. **Non-`gov.hk` sources** (ERB, Community Care Fund, SCHSA) — allowed and how
   labelled?
5. **Taxonomy unification:** collapse `AudienceGroup` into `beneficiary_groups`
   taxonomy, or keep both? (Affects finder + browse.)

---

### Phase 1 status: **complete.**

Per the workflow ("Never immediately write code… Only after finishing continue"
and "Before coding, explain what will change, why, affected files, risk"), I have
**not** modified application code. On your go-ahead I will begin **Batch A** with a
written pre-implementation brief (changes / rationale / affected files / risk /
tests / rollback) before touching any code.
```
