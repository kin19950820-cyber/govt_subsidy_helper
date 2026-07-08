# Benefits content store · 可擴充福利內容庫

This is the **scalable, non-hardcoded** data layer for the Hong Kong Benefits &
Public Services platform. It is designed to hold **300+ government benefits
without any schema or code change** — you add a data file, not code.

## How it fits together

```
content/
  taxonomy/
    categories.json        13 categories (學生資助 / 房屋 / 長者 / 就業 / 稅務 …)
    life_events.json       21 life events (新生嬰兒 / 搵工 / 退休 / 移居廣東 …)
  benefits/
    <slug>.json            ONE file per benefit (the source of truth for the app)

scripts/
  build-benefits.mjs       validates + aggregates → src/lib/benefits/benefits.generated.json
  emit-benefits.ts         one-off migration from the old schemes-data.ts

src/lib/benefits/
  types.ts                 generic Benefit model (superset — fits any benefit)
  registry.ts              load + faceted query (category / life event / age / facets / text)
  adapter.ts               Benefit → legacy SubsidyScheme (keeps existing UI working)
  benefits.generated.json  built artefact the app imports (do not edit by hand)

supabase/
  benefits_schema.sql      the 300+-ready DB schema (8 tables + life_events + JSONB facets)

knowledge/
  <slug>.md                the human research source of truth (cited, per benefit)
```

The web app reads benefits from `benefits.generated.json` (built from
`content/benefits/`). When Supabase is configured, `public.benefits`
(`supabase/benefits_schema.sql`) is the runtime store instead — same shape.

## Why it scales to 300+ without schema changes

- Free-form / extensible attributes live in **JSONB** (`facets`, `eligibility`,
  `steps`, `match_rule`). New facets (occupation, housing status, …) are just new
  keys — no `ALTER TABLE`, no code change.
- Details are **normalised child tables** (documents / forms / sources / faq /
  rules / life_events) that grow by rows.
- Search is **faceted** via `registry.queryBenefits()` and a GIN index on
  `facets` in Postgres.

Searchable by: category, life event, age, income/means, student, disability,
elderly, and free text — all without touching the schema.

## How to add a new benefit

1. Research it from **official `*.gov.hk` sources** and write
   `knowledge/<slug>.md` (use `/kb-research <name>` or the
   `kb-knowledge-researcher` agent). Cite every fact; mark unknowns
   `⚠️ Needs Manual Review`.
2. Create `content/benefits/<slug>.json` (copy an existing file as a template).
   Set `categoryCode` (must exist in `categories.json`) and `lifeEvents` (must
   exist in `life_events.json`). Keep `status: needs_review` until verified.
3. Run `npm run benefits:build` (also runs automatically on `npm run build`).
4. The benefit now appears under `/benefits` (its category + life events),
   `/schemes/<slug>`, the finder, and the checklist — no code change.

## Adding a category or life event

Add an entry to `content/taxonomy/categories.json` or `life_events.json`, then
rebuild. The browse page and validation pick it up automatically.

## Quality rules (same as the knowledge base)

Official government sources only · never invent eligibility · never estimate
amounts · keep legal wording's meaning · cite the official URL · mark uncertain
items `⚠️ Needs Manual Review`. The knowledge base (`knowledge/`) remains the
single source of truth; this content store should be kept consistent with it.
