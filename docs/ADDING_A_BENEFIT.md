# Adding a Benefit

No code change is needed to add a benefit — add data, run the pipeline.

1. **Research** from official `*.gov.hk` (and approved statutory bodies) sources.
   Prepare a research draft under `research/benefits/<slug>/` (see
   `docs/RESEARCH_AND_VERIFICATION.md`) and, ideally, `knowledge/<slug>.md`.
   Never invent amounts/thresholds/dates; mark uncertainty explicitly.

2. **Create** `content/benefits/<slug>.json` (copy an existing file):
   - `categoryCode` ∈ `content/taxonomy/categories.json`; `lifeEvents` ⊆
     `life_events.json`; `schemeType` ∈ `scheme_types.json`.
   - Add `aliases` / `cantoneseNames` / `formerNames` for search (e.g. 生果金,
     長生津) — aliases must be unique across benefits.
   - Put changing figures in `amounts[]`, each with `effectiveFrom` + `source`.
   - Add a curated `ruleSet` (see `docs/RULE_ENGINE.md`) with `labelZh` +
     `sourceRef` on each condition; otherwise the engine falls back to the
     legacy `matchRule` shim.
   - Fill `sources[]` with `sourceType` + `lastCheckedAt`.
   - Start at `status: "needs_review"`. Only set `verified` after human review
     **and** all critical fields pass.

3. **Build & validate**
   ```
   npm run benefits:build      # aggregate + verified-critical gate
   npm run completeness         # completeness report
   npm run typecheck && npm run lint && npm test
   npm run check-links          # (network) official/form links
   ```

4. The benefit now appears under `/benefits`, `/schemes/<slug>`, the finder, and
   the checklist — with its verification badge and last-verified date.

## Closing a scheme

Set `archived: true` (and add a `changeLog` entry). It leaves discovery/matching
but stays reachable by URL with a "此計劃已完結" notice. Do not delete the record.
