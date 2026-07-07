---
description: Run the full Government Subsidy Knowledge Base pipeline (research → glossary → workflows → validate → web QA → change log)
argument-hint: "[subsidy name or slug, or 'all']"
---

Run the Hong Kong Government Subsidy Knowledge Base pipeline. Target: **$ARGUMENTS**
(if empty or `all`, process every subsidy currently in `src/lib/schemes-data.ts`
plus any already under `knowledge/`).

Execute the agents **in this order**, passing each one clear scope. Prefer
running independent research agents in parallel, then the dependent stages
sequentially. Between stages, briefly report what changed.

1. **kb-knowledge-researcher** — one invocation per target subsidy. Give each
   the subsidy name and any known official URL. Each writes/updates one
   `knowledge/<slug>.md`. (Run these in parallel where possible.)
2. **kb-terminology-expert** — refresh `knowledge/glossary.md` to cover every
   term used by the updated docs.
3. **kb-workflow-analyst** — refresh `knowledge/application_workflows.md`
   (generic journey + any per-subsidy workflows that differ), with Mermaid.
4. **kb-knowledge-validator** — audit all of `knowledge/` and write
   `validation/validation_report.md`. If it reports Critical/High findings,
   loop back to kb-knowledge-researcher to fix, then re-validate.
5. **kb-web-qa-reviewer** — compare the web app (`src/`) against the validated
   knowledge base and write `qa/qa_report.md`.
6. **kb-regression-tester** — diff old vs new `knowledge/` (git) and append to
   `changes/change_log.md`.

Rules for every stage: official `*.gov.hk` sources only; never invent or infer;
never simplify away a legal requirement; always cite the official URL and
publication/update date; mark uncertain items `⚠️ Needs Manual Review`.

At the end, summarise: files written, open Critical/High findings from
validation and QA, and the list of all `⚠️ Needs Manual Review` items that need
a human.
