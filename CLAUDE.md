# 津貼助手 · Project guide

A mobile-first Hong Kong government subsidy finder (Next.js App Router +
TypeScript + Tailwind + Supabase), plus an official-source research pipeline.

## Repo layout

- `src/` — the web app (finder, schemes, benefits browse, checklist, profile,
  drafts, admin).
- `content/` — **the scalable, non-hardcoded benefits content store.**
  `content/benefits/<slug>.json` (one file per benefit) + `content/taxonomy/`
  (categories, life_events). Aggregated by `scripts/build-benefits.mjs` into
  `src/lib/benefits/benefits.generated.json`, which the app imports. Add a
  benefit = add a JSON file + `npm run benefits:build` (see `content/README.md`).
  Generic model + faceted query live in `src/lib/benefits/`.
- `supabase/benefits_schema.sql` — the 300+-ready DB schema (benefits + 7 child
  tables + life_events + JSONB facets); runtime store when Supabase is set up.
- Legacy `src/lib/schemes-data.ts` is now only the migration source; the app
  reads benefits via the content registry (`src/lib/schemes.ts` adapter).
- `research-agent/` — standalone crawler that downloads official WFSFAA PDFs and
  emits structured data (`data/processed/`, `supabase/seed_subsidy_schemes.sql`).
- `knowledge/` — **the Government Subsidy Knowledge Base: the single source of
  truth** for subsidy facts. One Markdown doc per subsidy + `glossary.md` +
  `application_workflows.md`.
- `validation/`, `qa/`, `changes/` — reports from the KB agents.
- `.claude/agents/kb-*.md` — six reusable subagents. `.claude/commands/kb-*.md`
  — slash commands to run them independently or as a pipeline.

## Source-of-truth principle

The web app must be **validated against `knowledge/`**, not against hardcoded
assumptions. When subsidy content in the app and the knowledge base disagree,
the knowledge base (once `status: verified`) wins. Use `/kb-qa` to check the app
against the KB; fix the app (or, if the KB is wrong, fix and re-validate the KB).

## The six KB agents (run independently or via `/kb-pipeline`)

1. `kb-knowledge-researcher` — deep-dives one subsidy → `knowledge/<slug>.md`.
2. `kb-terminology-expert` — maintains `knowledge/glossary.md`.
3. `kb-workflow-analyst` — maintains `knowledge/application_workflows.md`.
4. `kb-knowledge-validator` — audits KB → `validation/validation_report.md`.
5. `kb-web-qa-reviewer` — app vs KB → `qa/qa_report.md`.
6. `kb-regression-tester` — diffs KB versions → `changes/change_log.md`.

## Non-negotiable rules (for humans and agents)

- **Official `*.gov.hk` sources only.** No blogs/forums/news/AI summaries.
- **Never invent information. Never infer eligibility. Never simplify away a
  legal requirement.**
- **Always cite the official URL** and the publication/update date if shown.
- **Read the whole document before writing.**
- Mark uncertain items **`⚠️ Needs Manual Review`**; never guess a figure.
- Never claim eligibility is guaranteed — matches/estimates are for reference.

## Dev commands

- Web app: `npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint`
- Research crawler: `cd research-agent && npm run all` (polite, rate-limited).

## Git

Feature branch: `claude/hk-subsidy-finder-app-9m98ia`; `main` mirrors it. Commit
only when asked; do not open PRs unless asked.
