---
description: Research every benefit in a platform category from official sources
argument-hint: "<category_code or name> (e.g. housing, adult_learning, tax)"
---

Research the benefits in this platform category and add them to the knowledge
base + content store: **$ARGUMENTS**

Steps:
1. Resolve the category against `content/taxonomy/categories.json`.
2. List the benefits to cover (use the user's "Initial Benefits to Include" list
   for that category, plus any official ones you find). Confirm the list.
3. For **each** benefit, use the **kb-knowledge-researcher** agent (one per
   benefit, in parallel where possible) with the fuller `knowledge/_BENEFIT_TEMPLATE.md`.
   Each writes `knowledge/<slug>.md`, then creates `content/benefits/<slug>.json`
   with the correct `categoryCode` + `lifeEvents`.
4. Run `npm run benefits:build`, then `npm run typecheck` to confirm the app
   still builds.

Rules: official `*.gov.hk` (and statutory bodies like ERB) sources only; never
invent eligibility; never estimate amounts; cite every fact + date; mark
uncertain items `⚠️ Needs Manual Review`; set `status: needs_review` until the
Validator confirms. Report new files, and all Needs-Manual-Review items.
