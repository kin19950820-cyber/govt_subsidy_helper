---
description: Diff old vs new knowledge and append to changes/change_log.md
argument-hint: "[old git ref] [new git ref]"
---

Use the **kb-regression-tester** agent to diff the knowledge base and append to
`changes/change_log.md`. Refs: **$ARGUMENTS** (if empty, compare the working
tree / latest commit against the previous commit that touched `knowledge/`).

Remind it to classify changes into: eligibility, forms, workflow, means test,
dates, URLs — quoting old → new — and to note which web-app fields are likely
affected and which agents to re-run.
